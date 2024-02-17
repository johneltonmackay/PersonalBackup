/**
 *     |---------------------------------------------------------------------------------------------------------------------------------------|
 *     | Author                      | Date          | Version       | Comments                                                                |
 *     |-----------------------------|---------------|---------------|-------------------------------------------------------------------------|
 *     | MJ                          | June 26, 2019 | 1.0           | Initial Version                                                         |
 *     | maquino (cwgp)              | April 09, 2020| 1.1           | WNZ-910 - Include creation of JE for IR createdfrom RMA                 |
 *     |---------------------------------------------------------------------------------------------------------------------------------------|
 */

/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @NAmdConfig ../CWGP/namdconfig/WNZ_CONF_CWGP.json 
 */
define(['N/record', 'N/runtime', 'N/task', 'N/search', './WNZ_Library.js','JOURNALSCons','JOURNALS'],
	
	/**
	 * @param {record} record
	 */
	function(record, runtime, task, search,wnzlib, JOURNALSCons,JOURNALS) {


		function afterSubmit(context) 
	    {
			
			var stLogTitle = 'IR Consignment AfterSubmit';
				
		    log.debug(stLogTitle, 'runtime.executionContext = ' + runtime.executionContext + ', context.type = ' + context.type);
          
            
		    if ( context.type != context.UserEventType.DELETE)
		    {
		    	
		    	var objScript = runtime.getCurrentScript();
		    	var stSS = objScript.getParameter('custscript_wnz_itemprice_ss_ir');
		    	log.debug(stLogTitle, 'stSS '+stSS);
				
		    	var recTrans = context.newRecord;
				var recId = recTrans.id;
				var recType= recTrans.type;
				log.debug(stLogTitle, 'recId ='+recId + ' recType | ' + recType);
				
				var currentRecord = record.load({
					type: recType, 
					id: recId
				});
				
				var stOrderType = currentRecord.getValue('ordertype');
				log.debug(stLogTitle, 'stOrderType ='+stOrderType);
				
				if(stOrderType != 'RtnAuth') return;
				
				var stProcessed = currentRecord.getValue('custbody_wnz_consignment_processed');
				log.debug(stLogTitle, 'stProcessed ='+stProcessed);
				
				if(stProcessed) return;
				
				var intExLen = currentRecord.getLineCount('item');
				
				//Get Consigment Items
				var arrConItems = [];
				for (var intCtr = 0; intCtr < intExLen; intCtr++)
				{
					var bIsConsignment = currentRecord.getSublistValue('item', 'custcol_wnz_is_consignment', intCtr);
					
					if(bIsConsignment)
					{
						var stItem =  currentRecord.getSublistValue('item', 'item', intCtr);
						arrConItems.push(stItem);
					}
				}
				
				log.debug(stLogTitle, 'arrConItems ='+arrConItems);
				
				if(arrConItems.length == 0) return;
				
				//Search for price
				var objPrice = searchPrice(arrConItems, stSS);
				log.debug(stLogTitle, 'objPrice ='+JSON.stringify(objPrice));
				
				var objConsignment = {};
				
				for (var intCtr = 0; intCtr < intExLen; intCtr++)
				{
					var bIsConsignment = currentRecord.getSublistValue('item', 'custcol_wnz_is_consignment', intCtr);
					
					if(bIsConsignment)
					{
						var stId = intCtr;
						var stItem =  currentRecord.getSublistValue('item', 'item', intCtr);
						objConsignment[stId] = {};
						objConsignment[stId].custrecord_wnz_order = currentRecord.getSublistValue('item', 'orderdoc', intCtr);
						objConsignment[stId].custrecord_wnz_orderline = currentRecord.getSublistValue('item', 'orderline', intCtr);
						objConsignment[stId].custrecord_wnz_sales_contract = currentRecord.getSublistValue('item', 'custcol_wnz_contract_header', intCtr);
						objConsignment[stId].custrecord_wnz_ff_id = recId;
						objConsignment[stId].custrecord_wnz_ship_date = currentRecord.getValue('trandate');
						objConsignment[stId].custrecord_wnz_item = stItem;
						objConsignment[stId].custrecord_wnz_item_desc = currentRecord.getSublistValue('item', 'itemdescription', intCtr);
						if(objPrice[stItem]){
							objConsignment[stId].custrecord_wnz_day_price = objPrice[stItem];
						}
						objConsignment[stId].custrecord_wnz_conyn = bIsConsignment;
						objConsignment[stId].custrecord_wnz_location = currentRecord.getSublistValue('item', 'location', intCtr);
						objConsignment[stId].custrecord_wnz_customer = currentRecord.getValue('lineentity');
						objConsignment[stId].custrecord_wnz_qty_shipped =  forceFloat(currentRecord.getSublistValue('item', 'quantity', intCtr))*-1;
						// objConsignment[stId].custrecord_wnz_um = currentRecord.getSublistValue('item', 'locweightuom', intCtr);
						objConsignment[stId].custrecord_wnz_um = currentRecord.getSublistValue('item', 'unitsdisplay', intCtr);
						objConsignment[stId].custrecord_wnz_contract_um = currentRecord.getSublistValue('item', 'custcol_custcol_wnz_ocp_vol_unit', intCtr);
						objConsignment[stId].custrecord_wnz_weight = forceFloat(currentRecord.getSublistValue('item', 'custcol_wnz_ocp_weightperunit', intCtr));		
						objConsignment[stId].custrecord_wnz_total_weight =	forceFloat(currentRecord.getSublistValue('item', 'custcol_wnz_ocp_totalweightbase', intCtr))*-1;
							
					}
				}
		    }
		    
		    log.debug(stLogTitle, 'objConsignment = ' + JSON.stringify(objConsignment));
		    
		    
	         for(var i in objConsignment)
	         {
	        	 var obj = objConsignment[i];
	        	 generateConsignmentRecord(obj);
	         }
	         
	         currentRecord.setValue('custbody_wnz_consignment_processed', true);
	         var stFFId= currentRecord.save();
	         log.debug(stLogTitle, 'Updated stFFId = ' + stFFId);

	        //-------------------------------------------------------------------------------------------------------------------//
	        // CREATE JE FOR IR WITH RMA ONLY ON CREATE
	        //-------------------------------------------------------------------------------------------------------------------//
			if(context.UserEventType.CREATE != context.type)
				return;

			var _CONSTANTS = JOURNALSCons.INITIALIZE();
			var _MODULE = _CONSTANTS.JOURNALS;;
			var MODULESETTINGS = _MODULE.TRANSACTION;			

			var curr = currentRecord;
			var createdFrom = curr.getValue({fieldId : MODULESETTINGS.FIELDS.CREATEDFROM}) || false;

			if(createdFrom == false){
				log.debug('EXIT - NO CREATEDFROM');
				return;
			}

			//check if createdfrom is of RMA type
			var lookup = search.lookupFields({
				type : 'transaction',
				id : createdFrom,
				columns : ['recordtype'],
			})			

			if(MODULESETTINGS.VALIDCREATEDFROMTYPES.indexOf(lookup['recordtype']) == -1 ){
				log.debug('EXIT - INVALID RECORDTYPE',lookup['recordtype']);
				return;
			}

			//createJE
			var paramObj = {			
				subsidiaryId : curr.getValue({fieldId : 'subsidiary'}),
				tranDate : curr.getValue({fieldId : 'trandate'}),
				tranId : curr.getValue({fieldId : 'tranid'}),

				recordId : curr.id,
				returnId : createdFrom,
			}

			var response = JOURNALS.createConsignmentJE(paramObj);			
			if(response.success == true){

				log.debug('SUCCESS TRUE - ATTEMPT LINK JE')

				var values = {}
				values[MODULESETTINGS.FIELDS.JEREC] = response.jeId;

				record.submitFields({
					type : curr.type,
					id : curr.id,
					values : values
				})
				log.debug('SUCCESS')
			}

	        //-------------------------------------------------------------------------------------------------------------------//

			    
	    }
		
		
		function generateConsignmentRecord(obj)
		{
			var stLogTitle  = 'generateConsignmentRecord';
			log.debug(stLogTitle, JSON.stringify(obj));
	         
			var rec = record.create({type: 'customrecord_wnz_consignment_fulfillment'});

	    	for (var key in obj) 
	    	{
	          if (obj.hasOwnProperty(key)) 
	          {
		             rec.setValue({
		                fieldId: key,
		                value: obj[key]
		             });
	          }
	    	}
	    	
	        var stId = rec.save({enableSourcing: false, ignoreMandatoryFields: false});
	        
	        log.audit(stLogTitle,'Created Consignment stId'+stId);
	        
		}
	
		function searchPrice(arrItem, stSavedSearch)
		{
			var stLogTitle  = 'searchPrice';
			
			log.debug(stLogTitle, ' searchPrice - searchPrice for  arrItem : '+ arrItem + ' stSavedSearch'+stSavedSearch);
			
			if(arrItem.length == 0 ) return '';
			
			var objPrice = {};
			
			var arrFilter = [];

			arrFilter.push(search.createFilter({    
				name: "internalid",      
				operator: "anyof",
				values: arrItem
			}));
			
			var arrResult =  runSearch(search, null, stSavedSearch, arrFilter);
			
			arrResult.each(function(objResult) {
				
				var stItem = objResult.getValue("internalid");
				objPrice[stItem] = objResult.getValue("vendorcost");
				
				return true;
			});
			
			log.debug(stLogTitle,'objPrice '+JSON.stringify(objPrice));
			
			return objPrice;
			
		}
		
		 function forceFloat(stValue) {
		        var flValue = parseFloat(stValue);

		        if (isNaN(flValue)) {
		            return 0.00;
		        }

		        return flValue;
		    }
		 
		return {
		
			afterSubmit : afterSubmit
			
		};

	});
