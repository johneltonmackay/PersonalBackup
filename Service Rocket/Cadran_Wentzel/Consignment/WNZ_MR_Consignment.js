/**
 * Copyright (c) 2018
 * AppWrap LLC
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of AppWrap LLC. ("Confidential Information").
 * You shall not disclose such Confidential Information and shall use it only in accordance with the terms of the license
 * agreement you entered into with AppWrap LLC.
 *
 * Script Description:
 * Mass Approval 
 *     |---------------------------------------------------------------------------------------------------------------------------------------|
 *     | Author                      | Date          | Version       | Comments                                                                |
 *     |-----------------------------|---------------|---------------|-------------------------------------------------------------------------|
 *     | M.Smith                     | Feb 2018      | 1.0           | Initial Version                                                         |                           |
 *     |---------------------------------------------------------------------------------------------------------------------------------------|
 *
 */
 
/**
 * @NModuleScope Public
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search', 'N/runtime', 'N/error', 'N/email', 'N/render', 'N/workflow', 'N/format',  './WNZ_Library.js'], function(record, search, runtime, error, email, render, workflow, format){
	
	var LOG_TITLE='MapReduceMassUpdate';
    var CACHE = {}, ErrorHandler = {}, EndPoint = {}, Util = {};

	var param_searchid = 'custscript_wnz_ss_detail';
	var param_searchid_con_ir = 'custscript_wnz_ss_con_ir';
	var param_toProcess = 'custscript_wnz_to_process';
	var param_lockid = 'custscript_wnz_lock_field';
	var param_ss_contracts = 'custscript_wnz_ss_contracts';

	var INT_BACK_CON = '1';
	var KG_UOM = '2';
	var KG_UM = 'kgs';

	
    EndPoint.getInputData = function (){
		
    	var stLogTitle = LOG_TITLE + '::getInputData';
    	log.debug(stLogTitle, '*** START ***');

    	var arrParamValues = Util.getParameterValues();
    	Util.validateScriptParamObj(arrParamValues);
    	
    	log.debug(stLogTitle, 'arrParamValues'+arrParamValues);
    	
		var searchObj = search.load({id:arrParamValues[param_searchid]});
		
		var arrFilters = searchObj.filters;
    	var arrColumns = searchObj.columns;
		
		var objFilter = JSON.parse(arrParamValues[param_toProcess]);
		
		if (objFilter.stStartDate && objFilter.stEndDate) 
	    {
			arrFilters.push(search.createFilter({    
				name: 'custrecord_wnz_ship_date',      
				operator: 'within',
				values: [objFilter.stStartDate, objFilter.stEndDate]
			}));
	       
	    }
	    else if (objFilter.stStartDate)
	    {
	    	arrFilters.push(search.createFilter({    
				name: 'custrecord_wnz_ship_date',      
				operator: 'onorafter',
				values: objFilter.stStartDate
			}));
	    }
	    else if (objFilter.stEndDate) 
	    {
	    	arrFilters.push(search.createFilter({    
				name: 'custrecord_wnz_ship_date',      
				operator: 'onorbefore',
				values: objFilter.stEndDate
			}));
	    }
		
		if(objFilter.stProcessType == INT_BACK_CON)
		{
			arrFilters.push(search.createFilter({    
				name: "custrecord_wnz_purchase_contract",      
				operator: "noneof",
				values:["@NONE@"]
			}));
		} 
		else
		{
			arrFilters.push(search.createFilter({    
				name: "custrecord_wnz_purchase_contract",      
				operator: "anyof",
				values:["@NONE@"]
			}));
		}
		
    	return search.create({
    		type: searchObj.searchType,
    		filters: arrFilters,
    		columns: arrColumns
    	});
    
		
    };
	
	 EndPoint.map = function ( context ){
    	
    	var stLogTitle = LOG_TITLE + '::map';
		var arrParamValues = Util.getParameterValues();
		
    	log.debug(stLogTitle, '>> value:: ' + JSON.stringify(context.value));
		log.debug(stLogTitle, '>> key:: ' + JSON.stringify(context.key));
		
		if(!context.value) return;
		
		var contextValue = JSON.parse( context.value );
		
		var objRec = {};
		objRec.recordType = contextValue.customrecord_wnz_consignment_fulfillment;
		objRec.id = contextValue.id;
		objRec.soid = contextValue.values["custrecord_wnz_order"].value;
		objRec.soline = contextValue.values["custrecord_wnz_orderline"].value;
		objRec.ifid = contextValue.values["custrecord_wnz_ff_id"].value;
		objRec.shipdate = contextValue.values["custrecord_wnz_ship_date"];
		objRec.item = contextValue.values["custrecord_wnz_item"].value;
		objRec.itemtxt = contextValue.values["custrecord_wnz_item"].text;
		objRec.itemdesc = contextValue.values["custrecord_wnz_item_desc"];
		objRec.itemdayprice = contextValue.values["custrecord_wnz_day_price"];
		objRec.location = contextValue.values["custrecord_wnz_location"].value;
		objRec.qty = contextValue.values["custrecord_wnz_qty_shipped"];
		objRec.um = contextValue.values["custrecord_wnz_um"];
		objRec.umcontract = contextValue.values["custrecord_wnz_contract_um"];
		objRec.weight = contextValue.values["custrecord_wnz_weight"];
		objRec.totweight = contextValue.values["custrecord_wnz_total_weight"];
		objRec.purcon = contextValue.values["custrecord_wnz_purchase_contract"].value;
		objRec.objType = '';
		if(contextValue.values["type.CUSTRECORD_WNZ_ORDER"])
		{
			objRec.objType = contextValue.values["type.CUSTRECORD_WNZ_ORDER"].value;
		}
		log.debug(stLogTitle, '>> objRec:: ' + JSON.stringify(objRec));

		context.write(objRec.itemtxt, objRec);
		
    };
    
 
    EndPoint.reduce = function (context)
	{
		var stLogTitle = LOG_TITLE + '::reduce::';
		
		var arrParamValues = Util.getParameterValues();
		
		log.debug(stLogTitle, '>> values:: ' + JSON.stringify(context.values));

		if(Util.isEmpty(context.values))
		{
			log.debug(stLogTitle, 'Continue..');
			return;
		}
		var bIsBacktoBack = false;
		
		var objFilter = JSON.parse(arrParamValues[param_toProcess]);
		if(objFilter.stProcessType == INT_BACK_CON)  bIsBacktoBack = true;
	 
		log.debug(stLogTitle, '>> key:: ' + JSON.stringify(context.key));
      
        var objRA  = {};
		objRA.arrMerged = [];
		objRA.flTotalWeight = 0;
		objRA.flWeight = 0;
		objRA.flQty = 0;
		
		var stActualItem = '';
		
		var bHasFulfillments = false;
		context.values.forEach(function(value) {
				var objItem = JSON.parse(value);
	            log.debug(stLogTitle, '>> objItem:: ' + JSON.stringify(objItem));
	            if(objItem.objType == 'RtnAuth' || objItem.objType == '')
				{
	                objRA.stItem = objItem.item;
					objRA.flTotalWeight +=  Util.forceFloat(objItem.totweight);
					objRA.flWeight +=  Util.forceFloat(objItem.weight);
					objRA.flQty +=    Util.forceFloat(objItem.qty);
					objRA.arrMerged.push(objItem.id);
	            } 
	            else 
	            {
	            	bHasFulfillments = true;
	            }
				
	        	stActualItem = objItem.item;
	    		
	    });

		log.debug(stLogTitle, '>> stActualItem:: ' +stActualItem);
		log.debug(stLogTitle, '>> objRA:: ' + JSON.stringify(objRA));
		log.debug(stLogTitle, '>> bHasFulfillments:: ' + bHasFulfillments);
		
		if(!bHasFulfillments)
		{
			//Merge
			mergeRAs(objRA);
			context.write(stActualItem, []);
			return;
		}
		var arrValidator = [];
		var blnValidator = true
		context.values.forEach(function(value) {
			var objItem = JSON.parse(value);
			log.debug(stLogTitle, '>> objItem for Validator:: ' + JSON.stringify(objItem));
			// Check if objType already exists in arrValidator
			var existingItem = arrValidator.find(item => item.objType === objItem.objType);

			if (existingItem) {
				// If objType exists, update the quantity
				existingItem.objQty += objItem.qty;
			} else {
				// If objType does not exist, add a new object to arrValidator
				arrValidator.push({
					objType: objItem.objType,
					objQty: objItem.qty,
				});
			}
		});

		var highestobjType = null;
		var highestQty = 0;

		arrValidator.forEach(function(item) {
			if (item.objQty > highestQty) {
				highestQty = item.objQty;
				highestobjType = item.objType;
			}
		});

		if (arrValidator.length > 1 && arrValidator) {
			if (highestobjType != 'RtnAuth' || highestobjType != ''){
				blnValidator = false
			} 
		}
		log.debug('blnValidator', blnValidator);
		log.debug('arrValidator', JSON.stringify(arrValidator));

		//group together items
		var objSummaryItem = {};
		context.values.forEach(function(value) {
			var objItem = JSON.parse(value);
			log.debug(stLogTitle, '>> objItem:: ' + JSON.stringify(objItem));
			if(objItem.objType != 'RtnAuth' && objItem.objType != '') {
              if(!objSummaryItem[objItem.purcon])
              {
                  objSummaryItem[objItem.purcon] ={};
                  objSummaryItem[objItem.purcon].qty = 0;
                  objSummaryItem[objItem.purcon].flQtyToAllocate = 0;
                  objSummaryItem[objItem.purcon].weight = 0;
                  objSummaryItem[objItem.purcon].totweight = 0;
                  objSummaryItem[objItem.purcon].arrIF = [];
              }

              objSummaryItem[objItem.purcon].item = objItem.item;
              objSummaryItem[objItem.purcon].qty +=  Util.forceFloat(objItem.qty);
              objSummaryItem[objItem.purcon].flQtyToAllocate +=  Util.forceFloat(objItem.totweight);
              objSummaryItem[objItem.purcon].weight = Util.forceFloat(objItem.weight);
              objSummaryItem[objItem.purcon].totweight += Util.forceFloat(objItem.totweight);
              objSummaryItem[objItem.purcon].purcon = objItem.purcon;
              objSummaryItem[objItem.purcon].um = objItem.um;
			  // Edited by ServiceRocket
			  if (blnValidator){
				objSummaryItem[objItem.purcon].arrIF.push(objItem.id);
			  }
            }
		});
		
		log.debug(stLogTitle, '>> objSummaryItem:: ' + JSON.stringify(objSummaryItem));
		var bIsToUpate = false;
		for(var xyz in objSummaryItem)
		{
			
			if( Math.abs(objRA.flTotalWeight) > 0)
			{
				if(objSummaryItem[xyz].flQtyToAllocate >= Math.abs(objRA.flTotalWeight))
				{
					
					//objSummaryItem[xyz].totweight = objSummaryItem[xyz].totweight+objRA.flTotalWeight;
					objSummaryItem[xyz].flQtyToAllocate = objSummaryItem[xyz].flQtyToAllocate + objRA.flTotalWeight;
					objSummaryItem[xyz].qty = objSummaryItem[xyz].qty+objRA.flQty;
					objRA.flTotalWeight = 0;
					objRA.flQty = 0;
				} 
				else 
				{
					objRA.flTotalWeight = objRA.flTotalWeight + objSummaryItem[xyz].flQtyToAllocate ;
					objRA.flQty = objRA.flQty + objSummaryItem[xyz].qty ;
					objSummaryItem[xyz].flQtyToAllocate = 0;
					objSummaryItem[xyz].qty = 0;
				}
				bIsToUpate = true;
			}
			
			if(objSummaryItem[xyz].flQtyToAllocate == 0)
			{
				var arrIfToProcess = objSummaryItem[xyz].arrIF; 
				for(var lll in arrIfToProcess)
				{
					var stId = record.submitFields({
						type: 'customrecord_wnz_consignment_fulfillment',
						id: arrIfToProcess[lll],
						values : {
							custrecord_wnz_merged : true,
							custrecord_wnz_ra_full_weight :  (objSummaryItem[xyz].totweight - objSummaryItem[xyz].flQtyToAllocate)
						}
					});
					log.audit(stLogTitle, '>> IF | Updated Order from RA:: ' +stId);
				}
				
				log.debug(stLogTitle, '>> REMOVING:: ' +xyz +' because total weight value is now 0');
				delete objSummaryItem[xyz];
				
			}
			else 
			{
				var arrIfToProcess = objSummaryItem[xyz].arrIF; 
				for(var lll in arrIfToProcess)
				{
					// Comment By CeanaTech (WNZ-1161)
					/*var stId = record.submitFields({
						type: 'customrecord_wnz_consignment_fulfillment',
						id: arrIfToProcess[lll],
						values : {
							custrecord_wnz_qty_shipped : objSummaryItem[xyz].qty,
							custrecord_wnz_total_weight : objSummaryItem[xyz].flQtyToAllocate,
							custrecord_wnz_ra_full_weight :  (objSummaryItem[xyz].totweight - objSummaryItem[xyz].flQtyToAllocate)
						}
					});*/
					var stId = record.submitFields({
						type: 'customrecord_wnz_consignment_fulfillment',
						id: arrIfToProcess[lll],
						values : {
							custrecord_wnz_ra_full_weight :  (objSummaryItem[xyz].totweight - objSummaryItem[xyz].flQtyToAllocate)
						}
					});
					log.audit(stLogTitle, '>> ELSE | Updated Order from RA:: ' +stId);
				}
				
				log.debug(stLogTitle, '>> REMOVING:: ' +xyz +' because total weight value is now 0');
			}
		}
		
		log.debug(stLogTitle, '>> UPDATED objRA:: ' + JSON.stringify(objRA));
		log.debug(stLogTitle, '>> UPDATED objSummaryItem:: ' + JSON.stringify(objSummaryItem));
		log.debug(stLogTitle, '>> UPDATED bIsToUpate:: ' + bIsToUpate);
		
		if(bIsToUpate)
		{
			//Merge RAmergeRAs
			mergeRAs(objRA, bIsToUpate);
		}
		
        //Search for contracts and store it
		var objContracts = searchContracts(arrParamValues[param_ss_contracts]);

		var arrConsigmentDetailLines = [];
		
		var arrCheck = [];
		
		//loop group
		for (var item in objSummaryItem) 
		{
			var objItem = objSummaryItem[item];
			
			log.debug(stLogTitle, '>> objItem:: ' + JSON.stringify(objItem));
			
			//Get contract for that item
			if(objContracts[objItem.item])
			{
				
				log.debug(stLogTitle, '>> objContracts[objItem.item]:: ' + JSON.stringify(objContracts[objItem.item]));
				
				var arrContracts = objContracts[objItem.item].arrContracts;
				var flQtyToAllocate =  objItem.flQtyToAllocate;
				
				if(flQtyToAllocate == 0)
				{
					arrCheck.push(true);
					continue;
				}
				var bHasCont = false;
				
				for(var i in arrContracts)
				{
					log.debug(stLogTitle, '>> index:: ' + i);
					
					var objCon = arrContracts[i];
					
					var bContractBacktoBack = false;
					if(objCon.backtoback) bContractBacktoBack = true;
					
					var objItemLink = clone(objItem);
					
					log.debug(stLogTitle, '>> objCon:: ' + JSON.stringify(objCon) + ' flQtyToAllocate '+flQtyToAllocate);
					
					if(bIsBacktoBack)
					{
						log.debug(stLogTitle, '>> Processing back to back... ');
						
						if(objCon.hdrcontract != objItemLink.purcon)
						{
							log.debug(stLogTitle, '>> objCon.hdrcontract:: ' + objCon.hdrcontract + ' objItemLink.purcon '+objItemLink.purcon);
							continue;
						}
					} 
					else
					{
						log.debug(stLogTitle, '>> bIsBacktoBack:: ' + bIsBacktoBack + ' bContractBacktoBack'+bContractBacktoBack);
						
						if(bContractBacktoBack != bIsBacktoBack) continue;
						
					}
					
					if(objCon.bIsItemVol && !objCon.contract){
						continue; //search for another one
					}
					
					//make sure balVol is not 0 and qty to allocate is not yet 0
					if(objCon.balVol > 0 && flQtyToAllocate > 0)
					{
						log.debug(stLogTitle, '>> objCon.balVol' + objCon.balVol + ' flQtyToAllocate'+ flQtyToAllocate);
						
						//if balance is greater than qty to allocate
						if(objCon.balVol > flQtyToAllocate)
						{
							
							log.debug(stLogTitle, '>> if balance is greater than qty to allocate');
							objCon.balVol = Util.forceFloat(objCon.balVol)-Util.forceFloat(flQtyToAllocate);
							objCon.usedVol = Util.forceFloat(objCon.usedVol)+Util.forceFloat(flQtyToAllocate);
								
							objItemLink.qtyforthiscontract = flQtyToAllocate;
					
							//Update array of contract
							arrContracts[i] = objCon;
							
							flQtyToAllocate = 0; // nothing to allocate anymore.. used up
							
							
						} 
						else 
						{
							log.debug(stLogTitle, '>> balance is less than OR equal qty to allocate');
							//balance is less than OR equal qty to allocate
							objItemLink.qtyforthiscontract = Util.forceFloat(objCon.balVol);

							//new val
							objCon.balVol = 0; 
							objCon.usedVol = Util.forceFloat(objCon.totVol); // must be total contract now
							flQtyToAllocate =  flQtyToAllocate-objItemLink.qtyforthiscontract;
							
							
						}
						
						objItemLink.qtyshipped = objItemLink.qtyforthiscontract;
						objItemLink.balVol = objCon.balVol;
						objItemLink.usedVol = objCon.usedVol;
						objItemLink.um =  objCon.um; 
						objItemLink.bIsItemVol = objCon.bIsItemVol;
						objItemLink.contract = objCon.contract;
						objItemLink.hdrcontract = objCon.hdrcontract;
						objItemLink.price = objCon.price;
						objItemLink.startdate = objCon.startdate;
						objItemLink.enddate = objCon.enddate;
						objItemLink.arrIF = objItem.arrIF;
						
						log.debug(stLogTitle, '>> objItemLink' + JSON.stringify(objItemLink));
						
						
						var stUpdateContract = updateContract(objItemLink);

						arrConsigmentDetailLines.push(objItemLink);
						bHasCont = true;
					} 

				}
				
				if(bHasCont)
				{
					
					arrCheck.push(true);
				} 
				else
				{
					arrCheck.push(false);
				}
			}
			
			log.debug(stLogTitle, '>> arrConsigmentDetailLines:: ' + JSON.stringify(arrConsigmentDetailLines));
			log.debug(stLogTitle, '>> arrCheck:: ' + arrCheck);

		};
	

		if(arrConsigmentDetailLines.length > 0)
		{
			context.write(stActualItem, arrConsigmentDetailLines);
		} 
		else 
		{
			var bErrorOut = false;
			for(var i in arrCheck)
			{
				if(!arrCheck[i])
				{
					bErrorOut = true;
				}
			}
			
			if(bErrorOut)
			{
				throw error.create({
					name : 'Script Error:::',
					message : 'No contract found for item internal id '+stActualItem
				});
			}
		}
		
	};
    

    EndPoint.summarize = function(summary){
    	
		
    	var stLogTitle = LOG_TITLE + '::summarize::';
    	
    	var arrParamValues = Util.getParameterValues();
    	
    	log.debug(stLogTitle, 'summary '+JSON.stringify(summary));
    	
    	var arrIds = [];
    	var arrConsigmentDetailLines = [];
    	var arrParamValues = Util.getParameterValues();
    	summary.output.iterator().each(function (key, arr)
        {
    		log.debug(stLogTitle, 'key '+key);
    		log.debug(stLogTitle, 'arr '+arr);
    		arrIds.push(key);
    		arrConsigmentDetailLines = arrConsigmentDetailLines.concat(JSON.parse(arr));
            return true;
        });
    	
    	log.debug(stLogTitle, 'arrConsigmentDetailLines '+JSON.stringify(arrConsigmentDetailLines));
    	
    	var stHeaderId = '';
    	var jeID = '';
    	var consignmentIF = [];
    	if(arrConsigmentDetailLines.length > 0)
		{
	    	//Create header
			var objHeaderInfo = JSON.parse(arrParamValues[param_toProcess]);
			stHeaderId = createHeaderSummary(objHeaderInfo);
			
			//Create Lines and update contracts
			for(var k in arrConsigmentDetailLines)
			{
				var objLine = arrConsigmentDetailLines[k];
				var stLinesId = createLineSummary(objLine,stHeaderId);
				for(itmif in objLine.arrIF)
				{	
					var stItmIFId = objLine.arrIF[itmif];
					var stConId  = updateConsignment(stItmIFId, stHeaderId);
					consignmentIF.push(stItmIFId);
				}
			}

			/*
	         * WNZ-522 Consignment
	         * Create G/L impact
	         */
			jeID = generateGLImpact({
				items: arrConsigmentDetailLines,
				script: runtime.getCurrentScript(),
				headerid: stHeaderId,
				consignmentif: consignmentIF
			});
		}


    	
    	if(arrParamValues[param_lockid])
    	{
			var stId = record.submitFields({
				type: 'customrecord_wnz_lock_record',
				id: arrParamValues[param_lockid],
				values : {
					custrecord_processed : stHeaderId
				}
			});
			

	    	log.audit(stLogTitle, 'udpated lock with stId '+stId);
	    	
    	}
    	
		
		ErrorHandler.summaryError(summary);
		
		log.debug(stLogTitle,'****  END OF SCRIPT ****');
		
	};

	function generateGLImpact(params)
	{
		var LOG_TITLE = 'generateGLImpact';
		log.debug(LOG_TITLE, 'params = ' + JSON.stringify(params));

		// Get accounts from preferences
		var invAssetAccCP = params.script.getParameter('custscript_wnz_inv_ass_acc_cp');
		var accruedPurchasesAcc = params.script.getParameter('custscript_wnz_accrued_purchase_account');
		var cogsAccCP = params.script.getParameter('custscript_wnz_cogs_account_cp');
		var subsidiary = params.script.getParameter('custscript_wnz_gl_subsidiary');

		// Create Journal Entry
		var jeRec = record.create({type: record.Type.JOURNAL_ENTRY, isDynamic: true});
		jeRec.setValue('subsidiary', subsidiary);
		jeRec.setValue('custbody_wnz_consignment_summary', params.headerid);
		jeRec.setValue('approvalstatus', '2');

		var trandate = jeRec.getValue('trandate');

		var lines = [
			{account: cogsAccCP, field: 'debit'},			// Item - Cost of Goods Sold
			{account: invAssetAccCP, field: 'credit'},		// Other Current Asset
			{account: invAssetAccCP, field: 'debit'},		// Other Current Asset
			{account: accruedPurchasesAcc, field: 'credit'}	// Other Current Liability
		];

		// Populate sublist
		for(var i=0; i< params.items.length; i++)
		{
			var item = params.items[i];
			
			var flQtyShipped = Util.forceFloat(item.qtyshipped) / Util.forceFloat(item.weight);
			//var flAmount = flQtyShipped * Util.forceFloat(item.price);
			var amount = flQtyShipped * Util.forceFloat(item.price);
			var flAmount = roundNumber(amount, 2);
			log.debug(LOG_TITLE, 'i: '+i+' amount = '+amount+' flAmount = '+flAmount);

			//log.debug(LOG_TITLE, 'i: '+i+' flAmount = '+flAmount);

			for(var j=0; j<lines.length; j++)
			{
				jeRec.selectNewLine('line');
            	jeRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    value: lines[j].account
                });
                jeRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: lines[j].field,
                    value: flAmount
                });
                jeRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'custcol_wnz_gl_item',
                    value: item.item
                });
                jeRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'custcol_wnz_gl_qty',
                    value: flQtyShipped
                });
                jeRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'custcol_wnz_gl_consign_price',
                    value: item.price
                });
                jeRec.commitLine('line');
			}
			
		}
		var jeId = jeRec.save(false, true);
        log.audit(LOG_TITLE,'Journal Entry #'+jeId+' successfully created');

        // Link journal entry to the Consignment Summary Header
        var stId = record.submitFields({
				type: 'customrecord_wnz_consign_summary',
				id: params.headerid,
				values : {
					custrecord_wnz_con_sum_je : jeId
				}
			});

        /*
         * Create JE Reversal for item fulfillments
         */
        if(params.consignmentif.length > 0 && !Util.isEmpty(trandate))
        {
        	
        	var results = searchIFJE(params.consignmentif);
	  
	        for(var i=0; i<results.length; i++)
	        {
	        	var glid = results[i];
	        	
	        	
	        	var glRec = record.load({type: record.Type.JOURNAL_ENTRY, id: glid});
	        	glRec.setValue('reversaldate', trandate);
	        	glRec.save();

	        	log.audit(LOG_TITLE, 'Reversal JE created for JE #'+glid);

	        }
        }

        return jeId;
	}
	
	function searchIFJE(arrIfs)  // searchIFJE(params.consignmentif)
	{
		var stLogTitle  = 'searchIFJE';
		
		log.debug(stLogTitle, ' searchIFJE - searchIFJE : '+ arrIfs);
		
		// Search for the JE id
		var arrColumns = [search.createColumn({name: 'custbody_wnz_consignment_gl_impact', join: 'custrecord_wnz_ff_id'})];
		
		var arrFilters = [
			search.createFilter({    
				name: 'internalid',      
				operator: 'anyof',
				values: arrIfs
			}),
			search.createFilter({    
				name: 'custbody_wnz_consignment_gl_impact',
				join: 'custrecord_wnz_ff_id',
				operator: 'noneof',
				values: '@NONE@'
			})
		];
	
		var arrResult =  runSearch(search, 'customrecord_wnz_consignment_fulfillment', null, arrFilters, arrColumns);

		log.debug(stLogTitle, 'result = ' + JSON.stringify(arrResult));
		var arrIFJE = [];
		arrResult.each(function(objResult) {
			var stIFJE = objResult.getValue({name: 'custbody_wnz_consignment_gl_impact', join: 'custrecord_wnz_ff_id'});
			if(!Util.inArray(stIFJE, arrIFJE)){
				arrIFJE.push(stIFJE);
			}
			return true;
		});
		
		log.debug(stLogTitle,'arrIFJE '+JSON.stringify(arrIFJE));
		
		return arrIFJE;
		
	}

	function roundNumber(num, scale) {
		if((''+num).indexOf('e') < 0) {
		//if(!("" + num).includes("e")) {
	    	return +(Math.round(num + "e+" + scale)  + "e-" + scale);
	  	} else {
	    	var arr = ("" + num).split("e");
	    	var sig = ""
		    if(+arr[1] + scale > 0) {
		    	sig = "+";
		    }
	    	return +(Math.round(+arr[0] + "e" + sig + (+arr[1] + scale)) + "e-" + scale);
	  	}
	}
    
	function searchContracts(stSavedSearch)
	{
		var stLogTitle  = 'searchContracts';
		
		log.debug(stLogTitle, ' searchContracts - stSavedSearch : '+ stSavedSearch);
		
		var objContracts = {};
		var arrResult =  runSearch(search, null, stSavedSearch, []);

		log.debug(stLogTitle, 'result = ' + JSON.stringify(arrResult));
		
		arrResult.each(function(objResult) 
		{
			
			var stItem = objResult.getValue("custrecord_wnz_con_det_item_number");
			var bIsItemVol = objResult.getValue({name: "custrecord_wnz_item_volume_contract", join: "CUSTRECORD_WNZ_CON_DET_CONTRACT_ID"});
			if(!objContracts[stItem])
			{
				objContracts[stItem] = {};
				objContracts[stItem].arrContracts = [];
			}
			
			var objCon = {};
			objCon.bIsItemVol = bIsItemVol;
			objCon.startdate = objResult.getValue({name: "custrecord_wnz_con_hdr_start_date", join: "CUSTRECORD_WNZ_CON_DET_CONTRACT_ID"});
			objCon.enddate = objResult.getValue({name: "custrecord_wnz_con_hdr_end_date", join: "CUSTRECORD_WNZ_CON_DET_CONTRACT_ID"});
			objCon.price = objResult.getValue("custrecord_wnz_con_det_neg_con_price");
			objCon.backtoback =  objResult.getValue({name: "custrecord_wnz_back_to_back_ref", join: "CUSTRECORD_WNZ_CON_DET_CONTRACT_ID"});
			objCon.hdrcontract =  objResult.getValue("custrecord_wnz_con_det_contract_id");
			
			if(bIsItemVol)
			{
				objCon.contract = objResult.getValue("internalid");
				objCon.totVol =  objResult.getValue("custrecord_wnz_con_det_total_volume");
				objCon.balVol =  objResult.getValue("custrecord_wnz_con_det_bal_volume");
				objCon.usedVol = objResult.getValue("custrecord_wnz_con_det_used_volume");
				objCon.um = objResult.getValue("custrecord_wnz_con_det_volume_uom");
			} 
			else 
			{
				objCon.contract = objResult.getValue("custrecord_wnz_con_det_contract_id");
				objCon.totVol =   objResult.getValue({name: "custrecord_wnz_con_hdr_total_volume", join: "CUSTRECORD_WNZ_CON_DET_CONTRACT_ID"});
				objCon.balVol =  objResult.getValue({name: "custrecord_qnz_con_hdr_bal_volume", join: "CUSTRECORD_WNZ_CON_DET_CONTRACT_ID"});
				objCon.usedVol = objResult.getValue({name: "custrecord_wnz_con_hdr_used_volume", join: "CUSTRECORD_WNZ_CON_DET_CONTRACT_ID"});
				objCon.um =  objResult.getValue({name: "custrecord_wnz_con_hdr_volume_uom", join: "CUSTRECORD_WNZ_CON_DET_CONTRACT_ID"});
			}
				
			objContracts[stItem].arrContracts.push(objCon);
	
			return true;
		});
		
		log.debug(stLogTitle,'objContracts '+JSON.stringify(objContracts));
		
		return objContracts;
		
	}
	
	function mergeRAs(objRA, bIsToUpate)
	{
		var stLogTitle  = 'mergeRAs';
		log.debug(stLogTitle,'objRA '+JSON.stringify(objRA));
		
		var arrRA = objRA.arrMerged;
		
		//if more than 1, then merge
		if(arrRA.length > 1 || bIsToUpate)
		{
			if(objRA.flTotalWeight != 0)
			{
				//Create new Merged data
				var newRA = record.copy({
				    type: 'customrecord_wnz_consignment_fulfillment',
				    id: arrRA[0],
				    isDynamic: true
				});
			
				newRA.setValue('custrecord_wnz_ord_type', 'Merged Return Authorisation');
				newRA.setValue('custrecord_wnz_order', '');
				newRA.setValue('custrecord_wnz_order', '');
				newRA.setValue('custrecord_wnz_orderline', '');
				newRA.setValue('custrecord_wnz_ff_id', '');
				//newRA.setValue('custrecord_wnz_ship_date', '');
				//newRA.setValue('custrecord_wnz_qty_shipped', objRA.flQty);  // Comment By CeanaTech (WNZ-1161)
				//newRA.setValue('custrecord_wnz_total_weight', objRA.flTotalWeight); // // Comment By CeanaTech (WNZ-1161)
				newRA.setValue('custrecord_wnz_merged_con_info', arrRA);
				
				var stNEWRA = newRA.save({enableSourcing: false, ignoreMandatoryFields: false});
				log.audit(stLogTitle,'stNEWRA Id '+stNEWRA);
			}
			
			//Update As merged
			for(var i = 0; i < arrRA.length; i++ )
			{
				var stId = record.submitFields({
					type: 'customrecord_wnz_consignment_fulfillment',
					id: arrRA[i],
					values : {
						custrecord_wnz_merged : true
					}
				});
				
				log.audit(stLogTitle,'merged Id '+stId);
				
			}
		}
		
	}
	function updateContract(objLine)
	{
		
		var stLogTitle  = 'updateContract';
		
		log.debug(stLogTitle, ' updateContract - objLine : '+ JSON.stringify(objLine));
		
		//If item volume, deduct on the header
		if(!objLine.bIsItemVol)
		{
			log.debug(stLogTitle, '>> Header....:: ');
			var recTrans = record.load({type: 'customrecord_wnz_contract_header', id: objLine.hdrcontract});
			
			//WNZ-522
			var flTotalVolume = recTrans.getValue('custrecord_wnz_con_hdr_total_volume');
			var flBalanceVolume = flTotalVolume - objLine.usedVol;
			log.debug(stLogTitle, 'flTotalVolume '+ flTotalVolume +' flBalanceVolume '+flBalanceVolume);
			
			recTrans.setValue('custrecord_wnz_con_hdr_used_volume', objLine.usedVol);
			recTrans.setValue('custrecord_qnz_con_hdr_bal_volume', flBalanceVolume);
			
			if(flBalanceVolume == 0)
			{
				recTrans.setValue('custrecord_wnz_con_hdr_contract_sts', '3'); //completed
			}
	
			var stId = recTrans.save({enableSourcing: false, ignoreMandatoryFields: true});
			
			log.audit(stLogTitle, '>> updated contract header stId:: ' + stId);
		} 
		else 
		{
			log.debug(stLogTitle, '>> Line....:: ');
			
			//Update on the line
			var recTransLine = record.load({type: 'customrecord_wnz_contract_details', id: objLine.contract});
		
			var flTotalVolume = recTrans.getValue('customrecord_wnz_contract_details');
			var flBalanceVolume = flTotalVolume - objLine.usedVol;

			log.debug(stLogTitle, 'flTotalVolume '+ flTotalVolume +' flBalanceVolume '+flBalanceVolume);
			
			recTransLine.setValue('custrecord_wnz_con_det_used_volume', objLine.usedVol);
			recTransLine.setValue('custrecord_wnz_con_det_bal_volume', flBalanceVolume);
			
		
			var stId = recTransLine.save({enableSourcing: false, ignoreMandatoryFields: true});
			log.audit(stLogTitle, '>> updated contract line stId:: ' + stId);
		}
		
	}
	
	function updateConsignment(stConId, stHeaderId)
	{
		var stLogTitle  = 'updateConsignment';
		
		record.submitFields({
             type: 'customrecord_wnz_consignment_fulfillment',
             id: stConId,
             values: {
            	 custrecord_wnz_sum_processed: stHeaderId
             }
         });
		
		log.audit(stLogTitle, ' - updateConsignment : '+ stConId);
		
	}
	
	function createLineSummary(objLine,stHeaderId)
	{
		var stLogTitle  = 'createLineSummary';
		
		log.debug(stLogTitle, ' - createLineSummary : '+ JSON.stringify(objLine));
		
		var rec = record.create({type: 'customrecord_wnz_consign_summary_list'});
		
		var dStartDate = format.parse({
			value:objLine.startdate,
			type: format.Type.DATE
		});
		
		var dEndDate = format.parse({
			value: objLine.enddate,
			type: format.Type.DATE
		});

		// WNZ-522 Consignment, set UM to item's base unit
		// get item's base unit
		var itemLookup = search.lookupFields({
			type: 'item',
			id: objLine.item,
			columns: ['recordtype']
		});
    		//console.log(itemLookup);
    	var recordtype = itemLookup.recordtype;

		// get reclass item's base unit
		var itemRec = record.load({type: recordtype, id: objLine.item});
		var baseunit = itemRec.getValue('baseunit');

		
		rec.setValue({ fieldId: 'custrecord_wnz_list_header', value: stHeaderId});
		rec.setValue({ fieldId: 'custrecord_wnz_list_item', value: objLine.item});
		rec.setValue({ fieldId: 'custrecord_wnz_list_po_contract_hdr', value: objLine.hdrcontract});
		rec.setValue({ fieldId: 'custrecord_wnz_list_from_date', value: dStartDate});
		rec.setValue({ fieldId: 'custrecord_wnz_list_to_date', value: dEndDate});
		rec.setValue({ fieldId: 'custrecord_wnz_list_tot_weight', value: Util.forceFloat(objLine.qtyshipped)});
		var flQtyShipped = Util.forceFloat(objLine.qtyshipped) / Util.forceFloat(objLine.weight);
		rec.setValue({ fieldId: 'custrecord_wnz_list_qtyshipped', value: flQtyShipped});
		rec.setValue({ fieldId: 'custrecord_wnz_list_um', value: objLine.um});
		//rec.setValue({ fieldId: 'custrecord_wnz_list_um', value: baseunit});
		rec.setValue({ fieldId: 'custrecord_wnz_list_contract_um', value: objLine.um});
		rec.setValue({ fieldId: 'custrecord_wnz_list_weight', value: objLine.weight});
		rec.setValue({ fieldId: 'custrecord_wnz_list_contract_price',  value: objLine.price })
		rec.setValue({ fieldId: 'custrecord_wnz_list_contract_balance', value: objLine.balVol});
		var flContractCommitment = Util.forceFloat(flQtyShipped) *  Util.forceFloat(objLine.price);
		rec.setValue({ fieldId: 'custrecord_wnz_list_po_commitment', value: flContractCommitment});
        var stId = rec.save({enableSourcing: false, ignoreMandatoryFields: true});
       
        log.audit(stLogTitle,'Summary Line stId'+stId);
       
        return stId;
		
	}

		
	function createHeaderSummary(objHeader){
		
		var stLogTitle  = 'createHeaderSummary';
		
		log.debug(stLogTitle, ' - createHeaderSummary : '+ JSON.stringify(objHeader));
		
		var rec = record.create({type: 'customrecord_wnz_consign_summary'});

		var dStartDate = format.parse({
			value:objHeader.stStartDate,
			type: format.Type.DATE
		});
		
		var dEndDate = format.parse({
			value: objHeader.stEndDate,
			type: format.Type.DATE
		});
		rec.setValue({ fieldId: 'custrecord_wnz_con_sum_start_date', value: dStartDate});
		rec.setValue({ fieldId: 'custrecord_wnz_con_sum_end_date', value: dEndDate});
		rec.setValue({ fieldId: 'custrecord_wnz_con_sum_process_type', value: objHeader.stProcessType});
		
		var objUser = runtime.getCurrentUser();
		var stUser = objUser.id;
		
		log.debug(stLogTitle, '>> stUser....:: '+ stUser);
		rec.setValue('custrecord_wnz_con_gen_by', stUser);
		
    	
        var stId = rec.save({enableSourcing: false, ignoreMandatoryFields: true});
       
        log.audit(stLogTitle,'Summary Header stId'+stId);
       
        return stId;
		
	}
	   
	  
	/////////////////////////////
	/**
	 * @param {Error} e
	 * @param {String} stage
	 * @memberOf ErrorHandler
	 */
	ErrorHandler.sendNotification = function (e, stage){
		log.error('Stage: ' + stage + ' failed', e);
		
		var arrParamValues = Util.getParameterValues();
        
		var stId = record.submitFields({
			type: 'customrecord_wnz_lock_record',
			id: arrParamValues[param_lockid],
			values : {
				custrecord_errors : 'Stage: ' + stage + ' failed' + JSON.stringify(e)
			}
		});
		
		log.error('Updated error id: ' + stId);
		
	};
	/**
	 * @param {MapReduceScriptTask} summary object
	 * @memberOf ErrorHandler
	 */
	ErrorHandler.summaryError = function (summary){
        var inputSummary = summary.inputSummary;
        var mapSummary = summary.mapSummary;
        var reduceSummary = summary.reduceSummary;

        if (inputSummary.error)
        {
            var e = error.create({
                name: 'INPUT_STAGE_FAILED',
                message: inputSummary.error
            });
            ErrorHandler.sendNotification(e, 'getInputData');
        }

        ErrorHandler.stageError('map', mapSummary);
        ErrorHandler.stageError('reduce', reduceSummary);
	};
	/**
	 * @param {stage} stage
	 * @memberOf ErrorHandler
	 */
	ErrorHandler.stageError = function (stage, summary){
        var errorMsg = [];
        summary.errors.iterator().each(function(key, value){
            var msg = 'Error was: ' + JSON.parse(value).message + '\n';
            errorMsg.push(msg);
            return true;
        });
        if (errorMsg.length > 0)
        {
            var e = error.create({
                name: 'ERROR_IN_STAGE',
                message: JSON.stringify(errorMsg)
            });
            ErrorHandler.sendNotification(e, stage);
        }
	};
	/**
	 * @param {String} name
	 * @param {String} message
	 * @param {Boolean} notify
	 * @returns {error}
	 * @memberOf ErrorHandler
	 */
	ErrorHandler.create = function(name, message, notify){
		var objError = error.create({name: name,message: message,notifyOff: notify});
		log.error("ERROR FOUND", objError.name);
		return objError;
	};

	/////////////////////////////
	
	 /**
    * Evaluate if the given string or object value is empty, null or undefined.
    * @param {String} stValue - string or object to evaluate
    * @returns {Boolean} - true if empty/null/undefined, false if not
    * @memberOf Util
    */
	Util.isEmpty = function(stValue){
   	return ((stValue === '' || stValue == null || stValue == undefined)
   			|| (stValue.constructor === Array && stValue.length == 0)
   			|| (stValue.constructor === Object && (function(v){for(var k in v)return false;return true;})(stValue)));
	};
	
	/**
	 * @returns {Object} parameter Values
	 * @memberOf Helper
	 */
	Util.getParameterValues = function (){
		var logTitle = LOG_TITLE + '::getParameterValues';
		var cacheKey = ['getParameterValues'].join(':');
		
		if ( CACHE[cacheKey] == null )
		{
			var arrParamVals = {};
			var arrParamFlds = [param_searchid, param_toProcess, param_lockid, param_ss_contracts, param_searchid_con_ir];

			var currentScript = runtime.getCurrentScript();

			arrParamFlds.forEach(function(paramField)
			{
				arrParamVals[paramField] = currentScript.getParameter({name: paramField});
				return 1;
			});
			CACHE[cacheKey] = arrParamVals;
		}

		log.debug(logTitle, '** Script Parameters: ' + JSON.stringify(CACHE[cacheKey]));

		return CACHE[cacheKey];
	};

	Util.validateScriptParamObj = function(arrObj){
		for ( var stKeyParam in arrObj)
		{
			if (Util.isEmpty(arrObj[stKeyParam]))
			{
				throw error.create({
					name : 'MISSING_PARAMETER',
					message : 'Missing script parameter'
				});
			}
		}
	};

	Util.getByValue = function(arr, value) 
	{
	  for (var i=0, iLen=arr.length; i<iLen; i++) {

		if (arr[i].value == value) return arr[i].text;
	  }
	};

	Util.parseString = function(stText) 
	{
		if(!stText) return '';
		return stText;
	};
	
	Util.forceFloat =  function(stValue)
	{
		var flValue = parseFloat(stValue);

		if (isNaN(flValue))
		{
			return 0.00;
		}

		return flValue;
	};
	
	Util.inArray = function(val, arr)
	{   
		var bIsValueFound = false;  
		
		for(var i = 0; i < arr.length; i++)
		{
			if(val == arr[i])
			{
				bIsValueFound = true;        
				break;    
			}
		}
		
		return bIsValueFound;
	};
	
	Util.convNull = function(value)
	{
		if(value == null || value == undefined)
			value = '';
		return value;
	}

	Util.getAllRowsFromSearch = function(search, recType, searchId, filters, columns, overWriteCols)
	{
		var retList = new Array();
		var srchObj = null;
		if(searchId == null || searchId == '')
			srchObj = search.create({type : recType, filters: filters, columns: columns});
		else
		{
			srchObj = search.load({id : searchId});
			var existFilters = srchObj.filters;
			var existColumns = srchObj.columns;
			
			existFilters = (existFilters == null || existFilters == '') ? new Array() : existFilters;
			existColumns = (existColumns == null || existColumns == '') ? new Array() : existColumns;
			if(filters != null && filters != '')
			{
				for(var idx=0; idx < filters.length; idx++)
					existFilters.push(filters[idx]);
			}
			if(columns != null && columns != '')
			{
				if(overWriteCols == true)
					existColumns = columns;
				else
				{
					for(var idx=0; idx < columns.length; idx++)
						existColumns.push(columns[idx]);
				}
			}
			
			srchObj.filters = existFilters;
			srchObj.columns = existColumns;
		}
		
		var resultSet = srchObj.run();
		var startPos = 0, endPos = 1000;
		while (startPos <= 10000)
		{
			var options = new Object();
			options.start = startPos;
			options.end = endPos; 
			var currList = resultSet.getRange(options);
			if (currList == null || currList.length <= 0)
				break;
			if (retList == null)
				retList = currList;
			else
				retList = retList.concat(currList);
			
			if (currList.length < 1000)
				break;
			
			startPos += 1000;
			endPos += 1000;
		}
		
		return retList;
	}

	function clone(obj) {
	    if (null == obj || "object" != typeof obj) return obj;
	    var copy = obj.constructor();
	    for (var attr in obj) {
	        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
	    }
	    return copy;
	}

	
    return EndPoint;
});