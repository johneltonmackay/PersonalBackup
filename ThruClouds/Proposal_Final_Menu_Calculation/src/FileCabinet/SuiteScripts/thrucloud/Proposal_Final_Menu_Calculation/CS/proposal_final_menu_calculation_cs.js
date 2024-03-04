/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', "../Mapping/proposal_final_menu_mapping.js"],

    function (currentRecord, proposalMapping) {

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        
        function pageInit(scriptContext) {
            try {
                console.log('pageInit: Page Fully Loaded.');
            } catch (error) {
                console.log('Error: pageInit', error.message);
            }
        }

        function fieldChanged(scriptContext) {
            try {
                // console.log('fieldChanged', scriptContext.fieldId)
                var currentRecord = scriptContext.currentRecord;
                let arrBaseFloralFieldIds = proposalMapping.BASE_MENU_FIELDS.FLORAL_PRICE
                let arrBaseProposedFieldIds = proposalMapping.BASE_MENU_FIELDS.PROPOSED_PRICE
                let arrBaseMenuFieldIds = arrBaseFloralFieldIds.concat(arrBaseProposedFieldIds);

                let arrAddonNetFieldIds = proposalMapping.ADD_ON_FIELDS.NET_PRICE
                let arrAddonProposedFieldIds = proposalMapping.ADD_ON_FIELDS.PROPOSED_PRICE
                let arrAddonFieldIds = arrAddonNetFieldIds.concat(arrAddonProposedFieldIds);

                // console.log('fieldChanged arrAddonFieldIds', arrAddonFieldIds)

                if (scriptContext.fieldId == 'custbody_final_menu_base'){
                    updateBaseMenu (currentRecord, proposalMapping)
                }

                if (
                    scriptContext.fieldId == 'custbody_final_menu_addon_1' ||
                    scriptContext.fieldId == 'custbody_final_menu_addon_2' ||
                    scriptContext.fieldId == 'custbody_final_menu_addon_3' ||
                    scriptContext.fieldId == 'custbody_final_menu_addon_4' ||
                    scriptContext.fieldId == 'custbody_final_menu_addon_5' ||
                    scriptContext.fieldId == 'custbody_final_menu_addon_6'
                ) {
                    console.log('fieldChanged', scriptContext.fieldId)
                    processAddOns(currentRecord, proposalMapping, scriptContext, true)
                }

                if (scriptContext.fieldId == 'custrecord_amenity_cost') {
                    let objParam = {
                        fieldId: 'custrecord_amenity_cost',
                        totalFieldId: 'custrecord_am_total_cost'
                    }
                    calculateTotalCost(objParam, currentRecord);
                }
                
                if (scriptContext.fieldId == 'custrecord_amenities_srp') {
                    let objParam = {
                        fieldId: 'custrecord_amenities_srp',
                        totalFieldId: 'custrecord_total_gross_amount'
                    }
                    calculateTotalCost(objParam, currentRecord);
                }

                if (scriptContext.fieldId == 'custrecord_amenity_qty') {
                    updateTotalCost(currentRecord)
                }

                if (arrBaseMenuFieldIds.includes(scriptContext.fieldId)){
                    console.log('arrBaseMenuFieldIds scriptContext.fieldId', scriptContext.fieldId)
                    updateBaseMenu(currentRecord, proposalMapping)
                }

                if (arrAddonFieldIds.includes(scriptContext.fieldId)){
                    console.log('arrAddonFieldIds scriptContext.fieldId', scriptContext.fieldId)
                    processAddOns(currentRecord, proposalMapping, scriptContext, false)
                }

                

            } catch (error) {   
                console.log('Error: fieldChanged', error.message)
            }
        }

        // PRIVATE FUNCTION
        const processAddOns = (currentRecord, proposalMapping, scriptContext, blnControlFlow) => {
            console.log('blnControlFlow', blnControlFlow)
            let arrAddOnData = []

            let intBanquetType = currentRecord.getValue({
                fieldId:'custbody_proposal_banquet_type'
            })

            if (blnControlFlow){
                let intAddOn = currentRecord.getValue({
                    fieldId: scriptContext.fieldId
                })
                arrAddOnData.push({
                    fieldId: scriptContext.fieldId,
                    value: intAddOn
                })
            } else {
                let arrAddonFields = getAllAddOns(currentRecord)
                console.log('processAddOns: arrAddonFields', arrAddonFields)
                arrAddonFields.forEach(objData => {
                    let addOnFieldValue = currentRecord.getValue({ fieldId: objData.fieldId });
                    console.log('processAddOns: addOnFieldValue', addOnFieldValue)
                    if (addOnFieldValue){
                        arrAddOnData.push({
                            fieldId: objData.fieldId,
                            value: addOnFieldValue
                        })
                    }
                });

            }

            console.log('processAddOns: intBanquetType', intBanquetType)
                
  
            if (intBanquetType){
                if (arrAddOnData.length > 0){
                    arrAddOnData.forEach(objAddOn => {
                        processDataAddOn(currentRecord, proposalMapping, objAddOn.value, intBanquetType, objAddOn.fieldId)
                    });
                }
            }
            
        }

        const processDataAddOn = (currentRecord, proposalMapping, addOn, intBanquetType, paramFieldId)  => {
            console.log('processDataAddOn: paramFieldId', paramFieldId)
            console.log('processDataAddOn: addOn', addOn)
            console.log('processDataAddOn: intBanquetType', intBanquetType)
            let objRawData = {}
            let objFieldIds = {}
            switch (intBanquetType) {
                case "1":
                    objRawData = {
                        add_on: addOn,
                        arr_fieldid: proposalMapping.ADDON.ARR_TYPE1_FIELDID
                    }
                    objFieldIds = getAddOnFields(objRawData)
                    break;
                case "2":
                    objRawData = {
                        add_on: addOn,   
                        arr_fieldid: proposalMapping.ADDON.ARR_TYPE2_FIELDID
                    }
                    objFieldIds = getAddOnFields(objRawData)
                    break;
                case "3":
                    objRawData = {
                        add_on: addOn,
                        arr_fieldid: proposalMapping.ADDON.ARR_TYPE3_FIELDID
                    }
                    objFieldIds = getAddOnFields(objRawData)
                    break;
                // Add more cases if needed
                default:
                    // Handle default case if necessary
            }

            updateAddOn(objFieldIds, currentRecord, paramFieldId)
        }

        const updateAddOn = (objFieldIds, currentRecord, paramFieldId) => {
            console.log('updateAddOn: objFieldIds', objFieldIds)
            console.log('updateAddOn: paramFieldId', paramFieldId)
            let intProposedPrice = 0
            let intNetPrice = 0
            if (objFieldIds) {
                let proPrice = currentRecord.getValue({ fieldId: objFieldIds.PROPOSED_PRICE });
                let netPrice = currentRecord.getValue({ fieldId: objFieldIds.NET_PRICE });
                intProposedPrice = proPrice ? proPrice : 0;
                intNetPrice = netPrice ? netPrice : 0;
            }
            
            
            switch (paramFieldId) {
                case "custbody_final_menu_addon_1":
                    currentRecord.setValue({ fieldId:'custbody_final_menu_amount_addon_1', value:intProposedPrice });
                    currentRecord.setValue({ fieldId:'custbody_final_menu_nett_addon_1', value:intNetPrice });  
                    break;
                case "custbody_final_menu_addon_2":
                    currentRecord.setValue({ fieldId:'custbody_final_menu_amount_addon_2', value:intProposedPrice });
                    currentRecord.setValue({ fieldId:'custbody_final_menu_nett_addon_2', value:intNetPrice });  
                    break;
                case "custbody_final_menu_addon_3":
                    currentRecord.setValue({ fieldId:'custbody_final_menu_amount_addon_3', value:intProposedPrice });
                    currentRecord.setValue({ fieldId:'custbody_final_menu_nett_addon_3', value:intNetPrice });  
                    break;
                case "custbody_final_menu_addon_4":
                    currentRecord.setValue({ fieldId:'custbody_final_menu_amount_addon_4', value:intProposedPrice });
                    currentRecord.setValue({ fieldId:'custbody_final_menu_nett_addon_4', value:intNetPrice });  
                    break;
                case "custbody_final_menu_addon_5":
                    currentRecord.setValue({ fieldId:'custbody_final_menu_amount_addon_5', value:intProposedPrice });
                    currentRecord.setValue({ fieldId:'custbody_final_menu_nett_addon_5', value:intNetPrice });  
                    break;
                case "custbody_final_menu_addon_6":
                    currentRecord.setValue({ fieldId:'custbody_final_menu_amount_addon_6', value:intProposedPrice });
                    currentRecord.setValue({ fieldId:'custbody_final_menu_nett_addon_6', value:intNetPrice });  
                    break;
                // Add more cases if needed
                default:
                    // Handle default case if necessary
                    
            }
        }

        const getAllAddOns = (currentRecord) => {
            let arrAddOnData = []
            let arrAddonFields = [
                'custbody_final_menu_addon_1',
                'custbody_final_menu_addon_2',
                'custbody_final_menu_addon_3',
                'custbody_final_menu_addon_4',
                'custbody_final_menu_addon_5',
                'custbody_final_menu_addon_6',
            ]

            arrAddonFields.forEach(fieldId => {
                let addOnFieldValue = currentRecord.getValue({ fieldId: fieldId });
                if (addOnFieldValue){
                    arrAddOnData.push({
                        fieldId: fieldId
                    })
                }
            });

            console.log('getAllAddOns: arrAddOnData', arrAddOnData)
            return arrAddOnData
        }

        const updateBaseMenu = (currentRecord, proposalMapping) => {
            let intBanquetType = currentRecord.getValue({
                fieldId:'custbody_proposal_banquet_type'
            })
            let intBaseMenu = currentRecord.getValue({
                fieldId:'custbody_final_menu_base'
            })
            console.log('fieldChanged: intBanquetType', intBanquetType)
            console.log('fieldChanged: intBaseMenu', intBaseMenu)
            let objRawData = {}
            let objFieldIds = {}
            if (intBaseMenu && intBanquetType){
                switch (intBanquetType) {
                    case "1":
                        objRawData = {
                            base_menu: intBaseMenu,
                            arr_fieldid: proposalMapping.BASE_MENU.ARR_TYPE1_FIELDID
                        }
                        objFieldIds = getBaseMenuFields(objRawData)
                        break;
                    case "2":
                        objRawData = {
                            base_menu: intBaseMenu,
                            arr_fieldid: proposalMapping.BASE_MENU.ARR_TYPE2_FIELDID
                        }
                        objFieldIds = getBaseMenuFields(objRawData)
                        break;
                    case "3":
                        objRawData = {
                            base_menu: intBaseMenu,
                            arr_fieldid: proposalMapping.BASE_MENU.ARR_TYPE3_FIELDID
                        }
                        objFieldIds = getBaseMenuFields(objRawData)
                        break;
                    // Add more cases if needed
                    default:
                        // Handle default case if necessary
                }
                if (objFieldIds){
                    let intProposedPrice = currentRecord.getValue({ fieldId: objFieldIds.PROPOSED_PRICE });
                    let intFloralPrice = currentRecord.getValue({ fieldId: objFieldIds.FLORAL_PRICE });
            
                    // Set common fields regardless of the case
                    currentRecord.setValue({ fieldId:'custbody_final_menu_amount_base', value:intProposedPrice });
                    currentRecord.setValue({ fieldId:'custbody_final_menu_nett_base', value:intFloralPrice });     
                }
            } else {
                currentRecord.setValue({ fieldId:'custbody_final_menu_amount_base', value: 0 });
                currentRecord.setValue({ fieldId:'custbody_final_menu_nett_base', value: 0 });     
            }
        }

        const updateTotalCost = (currentRecord) => {
            let intQty = parseFloat(currentRecord.getCurrentSublistValue({
                sublistId: 'recmachcustrecord_amenities_transaction',
                fieldId: 'custrecord_amenity_qty'
            }));
            
            let intPurchasePrice = parseFloat(currentRecord.getCurrentSublistValue({
                sublistId: 'recmachcustrecord_amenities_transaction',
                fieldId: 'custrecord_amenity_cost'
            }));
            let intGrossPrice = parseFloat(currentRecord.getCurrentSublistValue({
                sublistId: 'recmachcustrecord_amenities_transaction',
                fieldId: 'custrecord_amenities_srp'
            }));

            currentRecord.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_amenities_transaction',
                fieldId: 'custrecord_am_total_cost',
                value: intQty * intPurchasePrice
            });

            currentRecord.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_amenities_transaction',
                fieldId: 'custrecord_total_gross_amount',
                value: intQty * intGrossPrice
            });
        }

        const calculateTotalCost = (objParam, currentRecord) => {
            let fieldValue = parseFloat(currentRecord.getCurrentSublistValue({
                sublistId: 'recmachcustrecord_amenities_transaction',
                fieldId: objParam.fieldId
            }));
            console.log('calculateTotalCost: fieldValue', fieldValue);

            let intQty = parseFloat(currentRecord.getCurrentSublistValue({
                sublistId: 'recmachcustrecord_amenities_transaction',
                fieldId: 'custrecord_amenity_qty'
            }));
            console.log('intQty', intQty);

            let totalCost = fieldValue * intQty;
            console.log('totalCost', totalCost);
        
            currentRecord.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_amenities_transaction',
                fieldId: objParam.totalFieldId,
                value: totalCost
            });
        }

        const getBaseMenuFields = (objRawData) => {
            let objFieldIds = {};
            let intBaseMenu = parseInt(objRawData.base_menu);
            switch (intBaseMenu) {
                case 1:
                    objFieldIds = objRawData.arr_fieldid[0].BASEMENU1_FIELD_ID;
                    break;
                case 2:
                    objFieldIds = objRawData.arr_fieldid[1].BASEMENU2_FIELD_ID;
                    break;
                case 3:
                    objFieldIds = objRawData.arr_fieldid[2].BASEMENU3_FIELD_ID;
                    break;
                // Add more cases if needed
                default:
                    // Handle default case if necessary
            }
            console.log('getBaseMenuFields: objFieldIds', objFieldIds);

            return objFieldIds

        }

        const getAddOnFields = (objRawData) => {
            let objFieldIds = {};
            let intAddOn = parseInt(objRawData.add_on);
            switch (intAddOn) {
                case 1:
                    objFieldIds = objRawData.arr_fieldid[0].ADDON1_FIELD_ID;
                    break;
                case 2:
                    objFieldIds = objRawData.arr_fieldid[1].ADDON2_FIELD_ID;
                    break;
                case 3:
                    objFieldIds = objRawData.arr_fieldid[2].ADDON3_FIELD_ID;
                    break;
                case 4:
                    objFieldIds = objRawData.arr_fieldid[0].ADDON_MANPOWER1_FIELD_ID;
                    break;
                case 5:
                    objFieldIds = objRawData.arr_fieldid[1].ADDON_MANPOWER2_FIELD_ID;
                    break;
                case 6:
                    objFieldIds = objRawData.arr_fieldid[2].ADDON_MANPOWER3_FIELD_ID;
                    break;
                case 7:
                    objFieldIds = objRawData.arr_fieldid[3].ADDON_WITHOUT_MAN1_FIELD_ID;
                    break;
                case 8:
                    objFieldIds = objRawData.arr_fieldid[4].ADDON_WITHOUT_MAN2_FIELD_ID;
                    break;
                case 9:
                    objFieldIds = objRawData.arr_fieldid[5].ADDON_WITHOUT_MAN3_ID;
                    break;
                // Add more cases if needed
                default:
                    // Handle default case if necessary
            }
            console.log('getAddOnFields: objFieldIds', objFieldIds);

            return objFieldIds

        }
        
        
        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged
        };

    });
