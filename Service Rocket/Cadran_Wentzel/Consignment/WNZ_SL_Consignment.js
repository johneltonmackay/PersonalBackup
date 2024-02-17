/**
 *     |---------------------------------------------------------------------------------------------------------------------------------------|
 *     | Author                      | Date          | Version       | Comments                                                                |
 *     |-----------------------------|---------------|---------------|-------------------------------------------------------------------------|
 *     | MJ Pascual	                 | June 2019     | 1.1           | Initial Version                                                         |
 *     |---------------------------------------------------------------------------------------------------------------------------------------|
 *
 */

 
/**
 * @NApiVersion 2.0
 * @NModuleScope SameAccount
 * @NScriptType suitelet
 */
define(['N/record', 'N/search', 'N/ui/serverWidget', 'N/runtime', 'N/error', 'N/format', 'N/url', 'N/task', './WNZ_Library.js'], function(record, search, serverWidget, runtime, error, format, url, task)
{
	
	//Get the data
	var objParam = 
	{
		'_suitelet_title' : 'Consignment Items',
		'_suitelet_sublistmsg': '',
		'_suitelet_ss1' : '',
		'_suitelet_cs': '',
		'_suitelet_listhdr': 'List',
		'_suitelet_grp1' : 'Filter',
		'_defaultday' : '',
	
	};
	
	var INT_LIMIT = 3000;
	var INT_SCHED_LEN = '0';
	var INT_BACK_CON = '1';
	
	var INT_STAT_INACTIVE  = '4';
	var INT_STAT_ACTIVE  = '2';
	
	function suitelet_consignment(option)
	{
		var stLogTitle = 'suitelet_consignment';

		try
		{
			log.debug(stLogTitle, '>> Entry Log <<');

			//Start Display of Form
			var obj = {};
			var objScript = runtime.getCurrentScript();
			obj.stAction = option.request.parameters.custpage_action;
			obj.stSS = objScript.getParameter('custscript_ci_ss');

			//Lock
			obj.stScriptLock = objScript.getParameter('custscript_ci_lock_id');
			obj.stScriptId = objScript.getParameter('custscript_ci_script_id');
			obj.stScriptDepId = objScript.getParameter('custscript_ci_script_dep_id');
			obj.stScriptContractSS = objScript.getParameter('custscript_wnz_contract_ss');
			
			log.debug(stLogTitle, 'obj ='+JSON.stringify(obj));
			
			
			if (obj.stAction == 'SUBMIT')
			{
				updateRecord(option, obj);
			} 
			
			//Search Scheduled Script if there's an existing task
			var objLookupRes = search.lookupFields({
				type:'customrecord_wnz_lock_record', 
				id : obj.stScriptLock, 
				columns : ['custrecord_task_id']
			});
			var scriptTaskId = objLookupRes.custrecord_task_id;
			log.debug(stLogTitle, 'scriptTaskId ='+scriptTaskId);
			
			var objForm = showSuiteletPage(option, obj, scriptTaskId);
			option.response.writePage(objForm);
			
						
			
		}
		catch (e)
		{
			if (e.message != undefined)
			{
				log.error('ERROR' , e.name + ' ' + e.message);
				throw e.name + ' ' + e.message;
			}
			else
			{
				log.error('ERROR', 'Unexpected Error' , e.toString()); 
				throw error.create({
					name: '99999',
					message: e.toString()
				});
			}
		}
		finally
		{
			log.debug(stLogTitle, '>> Exit Log <<');
		}

	}
	
	

	/**
	 * Show the suitelet form
	 * @option
	 * @stParamCourseSearch
	 */
	function showSuiteletPage(option, obj, scriptTaskId)
	{
		var stLogTitle = 'showSuiteletPage';
		log.debug(stLogTitle, 'Creating the form...');
		
		var scriptObj = runtime.getCurrentScript(); 
		
		var stStartDate = convNull(option.request.parameters.custpage_startdate);
		var stEndDate = convNull(option.request.parameters.custpage_enddate);
		var stProcessType = convNull(option.request.parameters.custpage_processtype);
		log.debug(stLogTitle, 'stStartDate'+stStartDate + ' stEndDate '+stEndDate + ' stProcessType '+stProcessType );
		
		//Create Form
		var objForm = serverWidget.createForm({
			title: objParam._suitelet_title,
			hideNavBar : false
		});
		
		objForm.clientScriptModulePath = './WNZ_CS_Consignment.js';
		
		//Action Field
		var objFldAction = objForm.addField({
			id : 'custpage_action',
			type : serverWidget.FieldType.TEXT,
			label : 'Action'
		});
		objFldAction.defaultValue = 'SUBMIT';
		objFldAction.updateDisplayType( { displayType: "HIDDEN" });
		
	
		
		//Status
		if(scriptTaskId)
		{
			
			var taskStatus = task.checkStatus(scriptTaskId);
			var stStatus = taskStatus.status;
			
			log.debug(stLogTitle, 'taskStatus.status =' +stStatus);
			
			var objFldMessage = objForm.addField({
				id : 'custpage_message',
				type : serverWidget.FieldType.INLINEHTML,
				label : 'Status'
			});
			
			var arrHTML = new Array();
	        arrHTML.push('<html><body>');
	        arrHTML.push('<font style="font-size: initial;"> STATUS : '+stStatus+'</font> <br/><br/>'); 
	      
			if(stStatus && (stStatus.toUpperCase() == 'COMPLETE' || stStatus.toUpperCase() == 'FAILED'))
			{
				
				if(stStatus.toUpperCase() == 'COMPLETE' )
				{
					var objLookupRes = search.lookupFields({
						type:'customrecord_wnz_lock_record', 
						id : obj.stScriptLock, 
						columns : ['custrecord_processed', 'custrecord_errors' , 'custrecord_task_id']
					});
					var arrProcessed = objLookupRes.custrecord_processed;
					var stErrors = objLookupRes.custrecord_errors;
					
					log.debug(stLogTitle, 'arrProcessed =' +JSON.stringify(arrProcessed));
					log.debug(stLogTitle, 'stErrors =' +stErrors);
					if(arrProcessed)
					{
						arrProcessed = arrProcessed.split(',');
						
						log.debug(stLogTitle, 'arrProcessed.length =' +arrProcessed.length);
						arrHTML.push('<font style="font-size: initial;"> Successfully Processed : <br/>'); 
						for(var intCtrC = 0; intCtrC < arrProcessed.length; intCtrC++)
						{
							var stVal = arrProcessed[intCtrC];
							log.debug(stLogTitle, 'stVal =' +stVal);
							var stLink = url.resolveRecord({    
								recordType: 'customrecord_wnz_consign_summary',    
								recordId: stVal,    
							}); 
							
							stLink += '&id='+stVal;
							arrHTML.push('<a target="_blank" href='+stLink+'>'+stVal+'</a><br/>'); 
						}
					}
					
					if(stErrors)
					{
						arrHTML.push('<br/>'); 
						arrHTML.push('<font style="font-size: initial;"> Errors : <br/>'); 
						arrHTML.push('<font style="font-size: initial;">'+stErrors+' <br/>'); 
					}
				}
				
				var stId = record.submitFields({
					type: 'customrecord_wnz_lock_record',
					id: obj.stScriptLock,
					values : {
						custrecord_task_id : '',
						custrecord_processed : '',
						custrecord_errors : '',
						custrecord_link : ''
					}
				});
				log.debug(stLogTitle, 'set null ::: stId ='+stId);
					
			}
			
			arrHTML.push('</body></html><BR>');
	        objFldMessage.defaultValue = arrHTML.join('');
	        objFldMessage.layoutType = serverWidget.FieldLayoutType.OUTSIDEABOVE;
	        objFldMessage.breakType = serverWidget.FieldBreakType.STARTCOL;
	        
	        objFldAction.defaultValue = 'REFRESH';
			
			 //Submit Button
			objForm.addSubmitButton({
				label : 'Refresh'
			});
		} 
		else 
		{
			//Deployment Id
			var objFldAction = objForm.addField({
				id : 'custpage_depid',
				type : serverWidget.FieldType.TEXT,
				label : 'Deployment Id'
			});
			objFldAction.defaultValue = scriptObj.deploymentId;
			objFldAction.updateDisplayType( { displayType: "HIDDEN" });
			
			//----------------------------------------- Filters --------------------------------------------------

			
			objForm.addFieldGroup({
				id : 'custpage_grpfilter',
				label : objParam._suitelet_grp1
			});
		
			var fld = objForm.addField({
				id : 'custpage_startdate',
				type : 'date',
				label : 'Start Date',
				container : 'custpage_grpfilter'
			});
			fld.isMandatory = true;
			fld.defaultValue = stStartDate;
			
			var fld = objForm.addField({
				id : 'custpage_enddate',
				type : 'date',
				label : 'End Date',
				container : 'custpage_grpfilter'
			});
			fld.isMandatory = true;
			fld.defaultValue = stEndDate;
			
			objForm.addFieldGroup({
				id : 'custpage_grpfilter2',
				label : 'Contracts'
			});
		
			var fld = objForm.addField({
				id : 'custpage_processtype',
				type : 'select',
				label : 'Process Type',
				source : 'customlist_wnz_process_type',
				container : 'custpage_grpfilter'
			});
			fld.defaultValue = stProcessType;
			fld.isMandatory = true;
		

			if(stStartDate &&  stEndDate && stProcessType) 
			{
				
				var objSearchContracts = searchContracts(obj.stScriptContractSS);
				
				var fld = objForm.addField({
					id : 'custpage_exclude',
					type : serverWidget.FieldType.MULTISELECT,
					label : 'Active Contracts to Inactivate',
					container : 'custpage_grpfilter2'
				});
				
				var flTotalContact = 0;
				for(var key in objSearchContracts)
				{
					var onjCon = objSearchContracts[key];
					if(onjCon.status == '2'){ //active
						fld.addSelectOption({
							value : onjCon.id,
							text : onjCon.name
						});
						
						flTotalContact += onjCon.vol ? parseFloat(onjCon.vol ) : 0;
					}
				}
				
				var fld = objForm.addField({
					id : 'custpage_include',
					type : serverWidget.FieldType.MULTISELECT,
					label : 'Inactive Contracts to Activate',
					container : 'custpage_grpfilter2'
				});
				
				for(var key in objSearchContracts)
				{
					var onjCon = objSearchContracts[key];
					if(onjCon.status == '4'){ //inactive
					fld.addSelectOption({
						value : onjCon.id,
						text : onjCon.name
					});
					}
				}
				
			

				//Add the sublist
				var objSublist = objForm.addSublist({
					id : 'custpage_sublist',
					type : serverWidget.SublistType.LIST,
					label : objParam._suitelet_listhdr,
					tab: 'custpage_tabid'
				});
				
				//Add Id
				var objFldId = objSublist.addField({
					id : 'custpage_id',
					type : 'text',
					label : 'Id'
				});
				objFldId.updateDisplayType({
					displayType : serverWidget.FieldDisplayType.HIDDEN
				});
				
				//Add Id
				var objFldId = objSublist.addField({
					id : 'custpage_rectype',
					type : 'text',
					label : 'Type'
				});
				objFldId.updateDisplayType({
					displayType : serverWidget.FieldDisplayType.HIDDEN
				});
				
				var arrFilter = [];
				if (stStartDate && stEndDate) 
			    {
					arrFilter.push(search.createFilter({    
						name: 'custrecord_wnz_ship_date',      
						operator: 'within',
						values: [stStartDate, stEndDate]
					}));
			       
			    }
			    else if (stStartDate)
			    {
			    	arrFilter.push(search.createFilter({    
						name: 'custrecord_wnz_ship_date',      
						operator: 'onorafter',
						values:stStartDate
					}));
			    }
			    else if (stEndDate) 
			    {
			    	arrFilter.push(search.createFilter({    
						name: 'custrecord_wnz_ship_date',      
						operator: 'onorbefore',
						values:stEndDate
					}));
			    }
				
				if(stProcessType == INT_BACK_CON)
				{
					arrFilter.push(search.createFilter({    
						name: "custrecord_wnz_purchase_contract",      
						operator: "noneof",
						values:["@NONE@"]
					}));
				} 
				else
				{
					arrFilter.push(search.createFilter({    
						name: "custrecord_wnz_purchase_contract",      
						operator: "anyof",
						values:["@NONE@"]
					}));
				}
				
				
				objForm.addFieldGroup({
					id : 'custpage_grpfilter3',
					label : 'Summary'
				});
				
				
				var objFldSum1 = objForm.addField({
					id : 'custpage_sum1',
					type : serverWidget.FieldType.FLOAT,
					label : 'Sum of all the quantities (Consignment Fulfillment)',
					container : 'custpage_grpfilter3'
				});
				objFldSum1.updateDisplayType( { displayType: "DISABLED" });
				
			
				var objFldSum2 = objForm.addField({
					id : 'custpage_sum2',
					type : serverWidget.FieldType.FLOAT,
					label : 'Sum of all the open quantities (Active Contract)',
					container : 'custpage_grpfilter3'
				});
				objFldSum2.updateDisplayType( { displayType: "DISABLED" });
				objFldSum2.defaultValue = flTotalContact;
				
				
				//Load the main saved search
				var arrResult =  runSearch(search, null, obj.stSS, arrFilter);
				
				log.debug(stLogTitle, 'arrResult ::: arrResult ='+JSON.stringify(arrResult));
				var arrColumns = arrResult.columns;
				var objColumns = {};
				
				for(var intColCtr=0; intColCtr < arrColumns.length; intColCtr++)
		        {
		            var objColumn = arrColumns[intColCtr];
		            var stColumn = JSON.stringify(objColumn);
		            var objColumnHold = JSON.parse(stColumn);
		            //log.debug(stLogTitle, 'stColumn'+stColumn);
					
		            // Getters
		            var stLabel = convNull(objColumnHold.label);
		            var stType = convNull(objColumnHold.type);
		           	var stJoin = convNull(objColumnHold.join).toLowerCase();
					var stName = convNull(objColumnHold.name).toLowerCase();
					
				
					var stFieldType = '';
					if(stType == 'clobtext') stType = 'textarea';
					
					if(stType == 'url' || stType == 'date' || stType == 'textarea'  || stType == 'checkbox' )
					{
						stFieldType = stType;
					} 
					else 
					{
						stFieldType = serverWidget.FieldType.TEXT;
					}
					
					//log.debug(stLogTitle, 'custpage_'+stName + ' |||| stLabel = '+stLabel + ' | stType = '+stType + ' | stName = '+stName);
					
					if(stJoin) stName = stName + '_zx_' + stJoin;
					
					var fld = '';
					if("select" == stFieldType )
					{
						try {
							var objFld = rec.getField(stName);
						
							if(objFld)
							{
								
								if(objFld.type == "multiselect")
								{
									stType = "multiselect";
									fld = objSublist.addField({
										id : 'custpage_'+stName,
										type : serverWidget.FieldType.TEXT,
										label : stLabel
									});
					
								} 
								else 
								{
								
									//log.debug(stLogTitle, 'objFld + ' + JSON.stringify(objFld));
									
									var objSelectOptions = objFld.getSelectOptions();
									//log.debug(stLogTitle, 'objSelectOptions + ' + JSON.stringify(objSelectOptions));
									//Add Checkbox
									fld = objSublist.addField({
										id : 'custpage_'+stName,
										type : stType,
										label : stLabel
									});
					
									fld.addSelectOption({value: ' ', text: ' '});
									for (var i in objSelectOptions) {
										fld.addSelectOption({value: objSelectOptions[i].value, text: objSelectOptions[i].text});
									}
									
								}
								
							} 
						} catch (errx) 
						{
		
						}
						
					} 
					else
					{
						
					
						fld = objSublist.addField({
							id : 'custpage_'+stName,
							type : stFieldType,
							label : stLabel
						});
						
					}
					
				
					//Save objColumns
					objColumns[intColCtr] = {};
					objColumns[intColCtr] = objColumn;
		        }	
				
				log.debug(stLogTitle, 'listing..');
			
				var flSum1 = 0;
				//Generate the saved search result on the list
				var intLineCount = 0;
				arrResult.each(function(objResult) 
				{
				
					log.debug(stLogTitle, 'objResult' + JSON.stringify(objResult));
					flSum1 += objResult.getValue({name: "custrecord_wnz_total_weight"}) ? parseFloat(objResult.getValue({name: "custrecord_wnz_total_weight"})) : 0;
					//For each column
					for(var intColCtr=0; intColCtr < arrColumns.length; intColCtr++)
					{
						
						var objColumn = arrColumns[intColCtr];
						var stColumn = JSON.stringify(objColumn);
						var objColumnHold = JSON.parse(stColumn);
						var stType = convNull(objColumnHold.type);
						var stJoin = convNull(objColumnHold.join).toLowerCase();
						var stName = convNull(objColumnHold.name).toLowerCase();
	
						//If not included in the header, skip it
						if(!objColumn) continue;
						
						if(stJoin) stName = stName + '_zx_' + stJoin;
						
						if(intColCtr == 0)
						{
							
							objSublist.setSublistValue(
							{
								 id : 'custpage_id',
								 line : intLineCount,
								 value : objResult.id
							});
							
							objSublist.setSublistValue(
							{
								 id : 'custpage_rectype',
								 line : intLineCount,
								 value : objResult.recordType
							});
				
						}
						
						//If not included in the header, skip it
						if(!objColumn) continue;
					
						//Get Value
						var stValue = objResult.getText(objColumn);
						if(!stValue)
						{
							stValue = objResult.getValue(objColumn);
						}
						
						log.debug(stLogTitle, 'custpage_'+stName + ' |||| stValue ='+stValue);
						
						if(stType == 'checkbox')
						{
							if(stValue == true || stValue == 'true' ) stValue = 'T';
							if(stValue == false || stValue == 'false') stValue = 'F';
						}
					
						if(stValue)
						{
							objSublist.setSublistValue(
							{
								 id : 'custpage_'+stName,
								 line : intLineCount,
								 value : stValue
							}); 
						} 
						
					
					}
						
						intLineCount++;
						return true;
				});
				
				
				//Submit Button
				objForm.addSubmitButton({
					label : 'Process Consignment'
				});
				
				objFldSum1.defaultValue = flSum1;
			 
			}
			
			
			objForm.addButton({
				id : 'custpage_filter',
				label : 'View Result',
				functionName : 'doFilter()'
			});
			
		}
		
		return objForm;
	}
	
	function searchContracts(stSS)
	{
		var stLogTitle = 'searchContracts';
		log.debug(stLogTitle, 'Processing searchContracts...');	
		
		var objContracts = {};
		var arrResult = runSearch(search, null, stSS, []);
		
		arrResult.each(function(objResult){
		
			log.debug(stLogTitle, 'objResult' + JSON.stringify(objResult));
			var stId = objResult.getValue("internalid");
			objContracts[stId] = {};
			objContracts[stId].id = stId;
			objContracts[stId].status = objResult.getValue("custrecord_wnz_con_hdr_contract_sts");
			objContracts[stId].name = objResult.getValue("name");
			objContracts[stId].vol = objResult.getValue("custrecord_qnz_con_hdr_bal_volume");
			
			return true;
		});	
	
		log.debug(stLogTitle, 'objContracts' + JSON.stringify(objContracts));
		
		return objContracts;
	}
	
	function updateRecord(option, obj)
	{
		var stLogTitle = 'updateRecord';
		log.debug(stLogTitle, 'Processing updateRecord...');	
		
		var request = option.request;
		
		var objFilters = {};
		objFilters.stStartDate = convNull(option.request.parameters.custpage_startdate);
		objFilters.stEndDate = convNull(option.request.parameters.custpage_enddate);
		objFilters.stProcessType = convNull(option.request.parameters.custpage_processtype);
		
		//ACTIVE CONTRACTS TO INACTIVATE
		var stExclude = convNull(option.request.parameters.custpage_exclude);
		var arrExclude = [];
		if(stExclude) 
		{
			arrExclude = stExclude.split('\u0005');
		}
		log.debug(stLogTitle, 'arrExclude =' + arrExclude );
		changeContractStatus(arrExclude, INT_STAT_INACTIVE);
		
		//INACTIVE CONTRACTS TO ACTIVATE
		var stInclude = convNull(option.request.parameters.custpage_include);
		var arrInclude = [];
		if(stInclude) 
		{
			arrInclude = stInclude.split('\u0005');
		}
		log.debug(stLogTitle, 'arrInclude =' + arrInclude);
		changeContractStatus(arrInclude, INT_STAT_ACTIVE);

		var intLineCount = request.getLineCount({group: 'custpage_sublist'});
		
		var arrIds = [];
		for(var intCtr = 0; intCtr < intLineCount; intCtr++)
		{
			var stId = request.getSublistValue({group: 'custpage_sublist', name: 'custpage_id', line: intCtr});
			arrIds.push(stId);
		}
		
		log.debug(stLogTitle, 'arrIds =' + arrIds );
		
		if(arrIds.length > 0)
		{
			//Run Map Reduce script
			var scriptTask = task.create({taskType: task.TaskType.MAP_REDUCE});
			scriptTask.scriptId = obj.stScriptId;
			scriptTask.deploymentId = obj.stScriptDepId;
			scriptTask.params = {
				'custscript_wnz_to_process': JSON.stringify(objFilters),
				'custscript_wnz_ss_detail': obj.stSS,
				'custscript_wnz_lock_field' : obj.stScriptLock,
			};
			
			log.audit(stLogTitle, 'scriptTask.params =' + JSON.stringify(scriptTask.params) );
			
			var scriptTaskId = scriptTask.submit();	
			log.debug(stLogTitle, 'scriptTaskId ='+scriptTaskId);
			
			var stId = record.submitFields({
				type: 'customrecord_wnz_lock_record',
				id: obj.stScriptLock,
				values : {custrecord_task_id : scriptTaskId},
				options: {
		            enableSourcing: false,
		            ignoreMandatoryFields : true
		        }
			});
			log.debug(stLogTitle, 'set scriptTaskId ::: stId ='+stId);
		}
		
	}
	
	function changeContractStatus(arrCon, status)
	{
		var stLogTitle = 'changeContractStatus';
		
		log.debug(stLogTitle, 'arrCon ='+arrCon + ' | status '+status);
		for (var i = 0;  i <  arrCon.length; i++)
		{
			var stSubmittedId = record.submitFields({
				type: 'customrecord_wnz_contract_header',
				id: arrCon[i],
				values : {'custrecord_wnz_con_hdr_contract_sts' : status},
			});
			
			log.debug(stLogTitle, 'stSubmittedId ='+stSubmittedId);
		}
	}
	
	function isEmpty(str) {
		return (!str || 0 === str.length);
	}
	
	function  getObjValues(option, objFields)
	{
		var stLogTitle = 'getObjValues';
		var objValues = {};
		objValues.hasValue = false;
		
		for (var x in objFields)
		{
			var stFld = objFields[x];
			objValues[stFld] = convNull(option.request.parameters['custpage_'+stFld]);
			if(objValues[stFld]) objValues.hasValue = 'T';
		}
		return objValues;
	}	
	
	String.prototype.wordWrap = function(m, b, c){ 
		var i, j, l, s, r;
		if(m < 1)
			return this;
		for(i = -1, l = (r = this.split("\n")).length; ++i < l; r[i] += s)
			for(s = r[i], r[i] = ""; s.length > m; r[i] += s.slice(0, j) + ((s = s.slice(j)).length ? b : ""))
				j = c == 2 || (j = s.slice(0, m + 1).match(/\S*(\s)?$/))[1] ? m : j.input.length - j[0].length
				|| c == 1 && m || j.input.length + (j = s.slice(m).match(/^\S*/)).input.length;
		return r.join("\n");
	};

	function inArrayAdvance(stName, stJoin , arrFields)
	{
		for(var i in arrFields)
		{
			var arrField = arrFields[i]
			
			
			var arr = arrField.split('.');
			if(arr && arr.length > 1)
			{
				if(stName == arr[0] && stJoin == arr[1]) return true;
			} 
			else 
			{
				if(stName == arr[0]) return true;
			}
			
		}
		return false;
	}
	
	function getSource(stName, stJoin , arrFields)
	{
		
		for(var i in arrFields)
		{
			var arrField = arrFields[i]
			
			var arr = arrField.split('.');
		    //log.audit('MJ', 'arr '+arr);
			
			if(arr && arr.length > 1)
			{
				if(stName == arr[0] && stJoin == arr[1] && arr[2]) return arr[2];
			} 
			else 
			{
				if(stName == arr[0]  && arr[2]) return arr[2];
			}
			
		}
		
		return '';
	}

	return{
		onRequest : suitelet_consignment
	};
});