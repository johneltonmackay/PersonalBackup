/**
 *     |---------------------------------------------------------------------------------------------------------------------------------------|
 *     | Author                      | Date          | Version       | Comments                                                                |
 *     |-----------------------------|---------------|---------------|-------------------------------------------------------------------------|
 *     | MJ                          | June 26, 2019 | 1.0           | Initial Version                                                         |
 *     |---------------------------------------------------------------------------------------------------------------------------------------|
 */

/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/task', 'N/search', './WNZ_Library.js'],
	function(record, runtime, task, search) {
		function afterSubmit(context) {
			var stLogTitle = 'Consignment AfterSubmit';
			//log.debug('inventoryassignment')
			log.debug(stLogTitle, 'runtime.executionContext = ' + runtime.executionContext + ', context.type = ' + context.type);
			if ( context.type == context.UserEventType.DELETE) return;

			if ( context.type != context.UserEventType.DELETE)
			{
				var objScript = runtime.getCurrentScript();
				var stSS = objScript.getParameter('custscript_wnz_itemprice_ss');
				var sublistId;
				log.debug(stLogTitle, 'stSS '+stSS);

				var recTrans = context.newRecord;
				var recId = recTrans.id;
				var recType= recTrans.type;
				var flag;
				log.debug(stLogTitle, 'recId ='+recId + ' recType | ' + recType);
				if(recType != 'inventoryadjustment'){
					var createdFro = recTrans.getText('createdfrom');
					sublistId = 'item';
					if(createdFro.indexOf('Vendor Return Authorization') !== -1){
						if(recTrans.getText('entity') != '500 Rheinzink GmbH & Co. KG') return;
					}else{
						var status = recTrans.getValue('shipstatus');
						log.debug(stLogTitle, 'status ='+status);

						if(status != 'C') return;
					}
				}else{
					sublistId = 'inventory';
				}
				var currentRecord = record.load({
					type: recType,
					id: recId
				});
				var stProcessed = currentRecord.getValue('custbody_wnz_consignment_processed');
				log.debug(stLogTitle, 'stProcessed ='+stProcessed);

				if(stProcessed) return;
				var intExLen = currentRecord.getLineCount(sublistId);

				//Get Consigment Items
				var arrConItems = [];

				for (var intCtr = 0; intCtr < intExLen; intCtr++)
				{
					/*
			         * WNZ-1147 Consignment (Vendor Returns & Inventory Adjustments)
			         * added by Ruby (18th aug 2021)
			         */
					if(recType == 'inventoryadjustment'){  //inventory
						var locationCheck = currentRecord.getSublistValue('inventory', 'location_display', intCtr);
						var adjustQtyBy = currentRecord.getSublistValue('inventory', 'adjustqtyby', intCtr);
						if(locationCheck == 'VMAG' && adjustQtyBy <0){
							flag = duplicateCheck(recId,currentRecord.getSublistValue('inventory', 'line', intCtr),recType);
							if(flag){
								var stItem =  currentRecord.getSublistValue('inventory', 'item', intCtr);
								arrConItems.push(stItem);
							}
						}
					}else{
						var createdFro = currentRecord.getText('createdfrom');
						if(createdFro.indexOf('Vendor Return Authorization') !== -1) {
							var bIsConsignment = currentRecord.getSublistValue('item', 'custcol_wnz_consignment_settled_vra', intCtr);
							if(bIsConsignment){
								var stItem =  currentRecord.getSublistValue('item', 'item', intCtr);
								arrConItems.push(stItem);
							}
						}else{
							var bIsConsignment = currentRecord.getSublistValue('item', 'custcol_wnz_is_consignment', intCtr);
							if(bIsConsignment){
								var stItem =  currentRecord.getSublistValue('item', 'item', intCtr);
								arrConItems.push(stItem);
							}
						}
					}
				}
				log.debug('sublistId',sublistId)
				log.debug(stLogTitle, 'arrConItems ='+arrConItems);

				if(arrConItems.length == 0) return;

				//Search for price
				var objPrice = searchPrice(arrConItems, stSS);
				log.debug(stLogTitle, 'objPrice ='+JSON.stringify(objPrice));

				var objConsignment = {};
				var consignmentItems = [];

				for (var intCtr = 0; intCtr < intExLen; intCtr++){
					var weightCal;
					if(recType != 'inventoryadjustment') {
						var createdFro = currentRecord.getText('createdfrom');
						if(createdFro.indexOf('Vendor Return Authorization') !== -1){
							var bIsConsignment = currentRecord.getSublistValue('item', 'custcol_wnz_consignment_settled_vra', intCtr);
						}else{
							var bIsConsignment = currentRecord.getSublistValue('item', 'custcol_wnz_is_consignment', intCtr);
						}
					}else{
						var fieldLookUp = search.lookupFields({
							type: search.Type.ITEM,
							id: currentRecord.getSublistValue(sublistId, 'item', intCtr),
							columns: ['custitem_wnz_weight_kg_base_unit']
						});
						weightCal = fieldLookUp.custitem_wnz_weight_kg_base_unit;
						var bIsConsignment = false;
						var locationCheck = currentRecord.getSublistValue('inventory', 'location_display', intCtr);
						var adjustQtyBy = currentRecord.getSublistValue('inventory', 'adjustqtyby', intCtr);
						if(locationCheck == 'VMAG' && adjustQtyBy <0){
							flag = duplicateCheck(recId,currentRecord.getSublistValue('inventory', 'line', intCtr),recType);
							if(flag){
								var bIsConsignment = currentRecord.getSublistValue(sublistId, 'custcol_wnz_is_consignment', intCtr);
							}
						}
					}
					log.debug('bIsConsignment',bIsConsignment);
					if(bIsConsignment){
						var stId = intCtr;
						var stItem =  currentRecord.getSublistValue(sublistId, 'item', intCtr);
						objConsignment[stId] = {};
						objConsignment[stId].custrecord_wnz_order = currentRecord.getSublistValue(sublistId, 'orderdoc', intCtr) || recId;
						objConsignment[stId].custrecord_wnz_orderline = currentRecord.getSublistValue(sublistId, 'orderline', intCtr) || currentRecord.getSublistValue(sublistId, 'line', intCtr);
						objConsignment[stId].custrecord_wnz_sales_contract = currentRecord.getSublistValue(sublistId, 'custcol_wnz_contract_header', intCtr);
						objConsignment[stId].custrecord_wnz_ff_id = recId;
						objConsignment[stId].custrecord_wnz_ship_date = currentRecord.getValue('trandate');
						objConsignment[stId].custrecord_wnz_item = stItem;
						objConsignment[stId].custrecord_wnz_item_desc = currentRecord.getSublistValue(sublistId, 'itemdescription', intCtr) || currentRecord.getSublistValue(sublistId, 'description', intCtr);
						if(objPrice[stItem]){
							objConsignment[stId].custrecord_wnz_day_price = objPrice[stItem];
						}
						objConsignment[stId].custrecord_wnz_conyn = bIsConsignment;
						objConsignment[stId].custrecord_wnz_location = currentRecord.getSublistValue(sublistId, 'location', intCtr);
						if(recType == 'inventoryadjustment'){
							objConsignment[stId].custrecord_wnz_customer = currentRecord.getValue('entity');
							objConsignment[stId].lineCount = stId;
						}else{
							var createdFro = currentRecord.getText('createdfrom');
							if(createdFro.indexOf('Vendor Return Authorization') !== -1){
								objConsignment[stId].custrecord_wnz_customer = '';
							}else{
								objConsignment[stId].custrecord_wnz_customer = currentRecord.getValue('entity');
							}
						}
						objConsignment[stId].custrecord_wnz_qty_shipped =  currentRecord.getSublistValue(sublistId, 'quantity', intCtr) || (currentRecord.getSublistValue(sublistId, 'adjustqtyby', intCtr)*-1);
						objConsignment[stId].custrecord_wnz_um = currentRecord.getSublistValue(sublistId, 'unitsdisplay', intCtr) || currentRecord.getSublistValue(sublistId, 'units_display' , intCtr);//locweightuom
						objConsignment[stId].custrecord_wnz_contract_um = currentRecord.getSublistValue(sublistId, 'custcol_custcol_wnz_ocp_vol_unit', intCtr);
						objConsignment[stId].custrecord_wnz_weight = currentRecord.getSublistValue(sublistId, 'custcol_wnz_ocp_weightperunit', intCtr) || weightCal;
						objConsignment[stId].custrecord_wnz_total_weight =	currentRecord.getSublistValue(sublistId, 'custcol_wnz_ocp_totalweightbase', intCtr) || Number(Number(weightCal)*(Number(currentRecord.getSublistValue(sublistId, 'adjustqtyby', intCtr))*-1));

						consignmentItems.push(objConsignment[stId])
					}
				}
			}

			log.debug(stLogTitle, 'objConsignment = ' + JSON.stringify(objConsignment));

			for(var i in objConsignment){
				var obj = objConsignment[i];
				var recordIdG = generateConsignmentRecord(obj);

				if(recordIdG && recType == 'inventoryadjustment') {
					currentRecord.setSublistValue({
						sublistId : 'inventory',
						fieldId : 'custcol_wnz_consignment_ful',
						value:recordIdG,
						line:Number(obj.lineCount )
					});
				}
			} 
			log.debug('consignmentItems.length',consignmentItems.length)
			if(consignmentItems.length > 0){ // Added by Ruby WNZ-1187
				currentRecord.setValue('custbody_wnz_consignment_processed', true);

				/*
	             * WNZ-522 Consignment
	             * Create G/L impact
	             */
				var jeID = generateGLImpact({
					items: consignmentItems,
					script: objScript,
					subsidiary: currentRecord.getValue('subsidiary'),
					ifid: recId
				});

				currentRecord.setValue('custbody_wnz_consignment_gl_impact', jeID);

				var stFFId= currentRecord.save();
				log.debug(stLogTitle, 'Updated stFFId = ' + stFFId);
			}
		}
		function duplicateCheck(recId,line,recType){
			var wnz_consignment_fulfillmentSearch = search.create({
				type: 'customrecord_wnz_consignment_fulfillment',
				filters: [
					['custrecord_wnz_order', 'anyof', recId],
					'AND',
					['custrecord_wnz_orderline', 'equalto', line],
					'AND',
					['custrecord_wnz_ff_id', 'anyof', recId],
				],
				columns: ['internalid'],
			});
			var searchResults = wnz_consignment_fulfillmentSearch.run();
			var results = searchResults.getRange({
				start : 0,
				end   : 100
			});
			//log.debug('Number of wnz_consignment_fulfillment records found',results.length )
			if(results.length > 0){
				log.debug('Record already exist',results[0].getValue('internalid'));
				return false;
			}else{
				return true;
			}
		}

		function generateConsignmentRecord(obj)
		{
			var stLogTitle  = 'generateConsignmentRecord';
			log.debug(stLogTitle, JSON.stringify(obj));

			var rec = record.create({type: 'customrecord_wnz_consignment_fulfillment'});
			for (var key in obj){
				if (obj.hasOwnProperty(key)) {
					rec.setValue({
						fieldId: key,
						value: obj[key]
					});
				}
			}
			var stId = rec.save({enableSourcing: false, ignoreMandatoryFields: false});
			return stId;
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

		function generateGLImpact(params)
		{
			var LOG_TITLE = 'generateGLImpact';
			log.debug(LOG_TITLE, 'params = ' + JSON.stringify(params));
			var invAssetAccDP = params.script.getParameter('custscript_wnz_inv_ass_acc_day_price');
			var accruedPurchasesAcc = params.script.getParameter('custscript_wnz_accrued_purchase_account');
			var cogsAcc = params.script.getParameter('custscript_wnz_cogs_account_dp');

			var jeRec = record.create({type: record.Type.JOURNAL_ENTRY, isDynamic: true});
			var trandate = jeRec.getValue('trandate');
			jeRec.setValue('subsidiary', params.subsidiary);
			jeRec.setValue('approvalstatus', '2');
			jeRec.setValue('custbody_wnz_consignment_fulfillment', params.ifid);

			var lines = [
				{account: invAssetAccDP, field: 'debit'},		// Other Current Asset
				{account: accruedPurchasesAcc, field: 'credit'},// Other Current Liability
				{account: cogsAcc, field: 'debit'},				// Cost of Goods Sold
				{account: invAssetAccDP, field: 'credit'}		// Other Current Asset
			];

			for(var i=0; i< params.items.length; i++)
			{
				var item = params.items[i];
				var flamount = Number(item.custrecord_wnz_qty_shipped) * Number(item.custrecord_wnz_day_price);
				var amount = roundNumber(flamount, 2);
				log.debug(LOG_TITLE, 'i: '+i+' flamount = '+flamount+' amount = '+amount);

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
						value: amount
					});
					jeRec.setCurrentSublistValue({
						sublistId: 'line',
						fieldId: 'custcol_wnz_gl_item',
						value: item.custrecord_wnz_item
					});
					jeRec.setCurrentSublistValue({
						sublistId: 'line',
						fieldId: 'custcol_wnz_gl_qty',
						value: item.custrecord_wnz_qty_shipped
					});
					jeRec.setCurrentSublistValue({
						sublistId: 'line',
						fieldId: 'custcol_wnz_gl_consign_price',
						value: item.custrecord_wnz_day_price
					});
					jeRec.commitLine('line');
				}

			}
			var jeId = jeRec.save(false, true);
			log.debug(LOG_TITLE,'Journal Entry #'+jeId+' successfully created');

			return jeId;
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
		return {
			afterSubmit : afterSubmit
		};

	});