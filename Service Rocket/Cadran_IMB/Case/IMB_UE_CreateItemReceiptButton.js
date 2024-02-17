/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/error', 'N/url', 'N/runtime', 'N/search', './UtilityLib.js'],

function(NS_Record, NS_Error, NS_Url, NS_Runtime, NS_Search, UtilityLib) {

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext)
    {
        var stLogTitle = 'beforeLoad';
        if (scriptContext.type == scriptContext.UserEventType.VIEW)
        {
            var objScript = NS_Runtime.getCurrentScript();
            var stClientScriptId = objScript.getParameter("custscript_cad_cscreatereceipt");
            var stClientScriptIdCase = objScript.getParameter("custscript_cad_cscreatereceiptcase");
            var stSLScript = objScript.getParameter("custscript_cad_slscriptcreaterec");
            var stSLDeploy = objScript.getParameter("custscript_cad_sldeploycreaterec");

            log.debug(stLogTitle, 'stClientScriptId = ' + stClientScriptId);
            log.debug(stLogTitle, 'stClientScriptIdCase = ' + stClientScriptIdCase);
            log.debug(stLogTitle, 'stSLScript = ' + stSLScript);
            log.debug(stLogTitle, 'stSLDeploy = ' + stSLDeploy);
            var receiveAssetActive = false;

            var record = scriptContext.newRecord;
            var stRecId = record.id;
            var stRecType = record.type;
            var objForm = scriptContext.form;
            log.debug(stLogTitle, 'stRecId = ' + stRecId);
            // if record type is case
            if (stRecType == 'supportcase') {
                objForm.clientScriptFileId = stClientScriptIdCase;
                // get custevent_imb_so_case
                var stSalesOrder = record.getValue({
                    fieldId: 'custevent_imb_so_case'
                });
                if (stSalesOrder) {
                    // get custbody_imb_sales_order_type
                    var stSalesOrderType = NS_Search.lookupFields({
                        type: 'salesorder',
                        id: stSalesOrder,
                        columns: ['custbody_imb_sales_order_type']
                    });
                    log.debug(stLogTitle, 'stSalesOrderType = ' + JSON.stringify(stSalesOrderType))
                    if (stSalesOrderType) {
                        if (stSalesOrderType?.custbody_imb_sales_order_type[0]?.value == 4) {
                            receiveAssetActive = true;
                        }
                    }
                }

            } else {
                objForm.clientScriptFileId = stClientScriptId;
            }

            var stTriggerSLUrl = NS_Url.resolveScript({
                scriptId: stSLScript,
                deploymentId: stSLDeploy
            });
            
            
            /**
             * Change: IP-3083/IMB-2755
             * Scenario 1: Toon bestaande Create Item Receipt button op de RA enkel als 'custbody_imb_sales_order_type' = 'standard'  (customlist_imb_sales_order_type_list> ID=2)
             * Scenario 2: Indien 'custbody_imb_sales_order_type' = 'Workshop' toon button genaamd 'Receive Assets' op de RA (customlist_imb_sales_order_type_list> ID=4)
             */
            var salesOrderType
            if (stRecType != 'supportcase') {
                stTriggerSLUrl += '&custparam_record_id=' + stRecId;
                stTriggerSLUrl += '&custparam_record_type=' + stRecType;
            }
            if(stRecType == 'inboundshipment')
            {
                var stStatus = record.getValue({
                    fieldId: 'shipmentstatus'
                });

                log.debug(stLogTitle, 'stStatus = ' + stStatus);

                objForm.removeButton('receive');

                if(stStatus.toLowerCase() == 'received')
                {
                    return;
                }
            }
            else if(stRecType == 'purchaseorder')
            {
                var stCreatedFrom = record.getValue({
                    fieldId: 'createdfrom'
                });

                var arrPOFilters = [];
                arrPOFilters.push(NS_Search.createFilter({
                    name: 'internalid',
                    operator: NS_Search.Operator.ANYOF,
                    values: [stRecId]
                }));
                arrPOFilters.push(NS_Search.createFilter({
                    name: 'status',
                    operator: NS_Search.Operator.ANYOF,
                    values: ["PurchOrd:D", "PurchOrd:E", "PurchOrd:B","RtnAuth:D", "RtnAuth:B", "RtnAuth:E"]
                }));

                var arrPOColumns = [];
                arrPOColumns.push(NS_Search.createColumn({
                    name: 'internalid'
                }));

                var arrPOResults = UtilityLib.search('purchaseorder', null, arrPOFilters, arrPOColumns);

                if(UtilityLib.isEmpty(arrPOResults))
                {
                    return;
                }

                record = NS_Record.load({
                    type: record.type,
                    id: record.id
                });

                var intItems = record.getLineCount({
                    sublistId: 'item'
                });

                var boolHasCustomer = false;
                var boolQtyReceivedNotEqual = false;
                if(intItems > 0)
                {
                    for(var i = 0; i < intItems; i++)
                    {
                        var stCustomer = record.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'customer',
                            line: i
                        });

                        var flQuantity = record.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: i
                        });

                        var flQuantityReceived = record.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantityreceived',
                            line: i
                        });

                        if(!UtilityLib.isEmpty(stCustomer))
                        {
                            boolHasCustomer = true;
                        }

                        if(flQuantity != flQuantityReceived)
                        {
                            boolQtyReceivedNotEqual = true;
                        }
                    }
                }

                log.debug(stLogTitle, 'stCreatedFrom = ' + stCreatedFrom
                    + ' | boolHasCustomer = ' + boolHasCustomer
                    + ' | boolQtyReceivedNotEqual = ' + boolQtyReceivedNotEqual);

                if(!UtilityLib.isEmpty(stCreatedFrom) && boolHasCustomer == true)
                {
                    return;
                }

                if(boolQtyReceivedNotEqual == false)
                {
                    return;
                }
            }
            else if(stRecType == 'returnauthorization')
            {
                var arrRMAFilters = [];
                arrRMAFilters.push(NS_Search.createFilter({
                    name: 'internalid',
                    operator: NS_Search.Operator.ANYOF,
                    values: [stRecId]
                }));
                arrRMAFilters.push(NS_Search.createFilter({
                    name: 'status',
                    operator: NS_Search.Operator.ANYOF,
                    values: ["PurchOrd:D", "PurchOrd:E", "PurchOrd:B","RtnAuth:D", "RtnAuth:B", "RtnAuth:E"]
                }));

                var arrRMAColumns = [];
                arrRMAColumns.push(NS_Search.createColumn({
                    name: 'internalid'
                }));

                var arrRMAResults = UtilityLib.search('returnauthorization', null, arrRMAFilters, arrRMAColumns);

                if(UtilityLib.isEmpty(arrRMAResults))
                {
                    return;
                }

                salesOrderType = record.getValue({
                    fieldId: 'custbody_imb_sales_order_type'
                });
            }
            log.debug(stLogTitle, 'stRecType = ' + stRecType + ' | salesOrderType = ' + salesOrderType);
            if(stRecType == 'returnauthorization' && salesOrderType == 2) { //Scenario 1 
                objForm.addButton({
                    id : 'custpage_cad_createreceipt',
                    label : 'Create Item Receipt',
                    functionName : 'createReceipt(\'' + stTriggerSLUrl + '\')'
                });
            } else if(stRecType == 'returnauthorization' && salesOrderType == 4) { //Scenario 2
                var caseId = record.getValue({
                    fieldId: 'custbody_nx_case'
                });
                log.debug(stLogTitle, 'caseId = ' + caseId);
                if (caseId){
                    objForm.addButton({
                        id : 'custpage_cad_createreceipt',
                        label : 'Receive Assets',
                        functionName: 'createReceipt(\'' + stTriggerSLUrl + '\', true, \'' + caseId + '\')'
                    });
                } else {
                    objForm.addButton({
                        id : 'custpage_cad_createreceipt',
                        label : 'Receive Assets',
                        functionName : 'createReceipt(\'' + stTriggerSLUrl + '\', true)'
                    });
                }
            } else if (stRecType !== 'returnauthorization' && stRecType !== 'supportcase') { //Original
                objForm.addButton({
                    id : 'custpage_cad_createreceipt',
                    label : 'Create Item Receipt',
                    functionName : 'createReceipt(\'' + stTriggerSLUrl + '\')'
                });
            } else if (stRecType == 'supportcase' && receiveAssetActive) { //Scenario 3
                // get value custevent_imb_rma_case
                var rmaCase = record.getValue({
                    fieldId: 'custevent_imb_rma_case'
                });
                if (rmaCase) {
                    // load rma
                    var rmaRecord = NS_Record.load({
                        type: 'returnauthorization',
                        id: rmaCase
                    });
                    // get value orderstatus
                    var orderStatus = rmaRecord.getValue({
                        fieldId: 'orderstatus'
                    });
                    // if orderstatus is not closed
                    if (orderStatus == 'B') {
                        objForm.addButton({
                            id : 'custpage_cad_createreceipt',
                            label : 'Receive Assets',
                            functionName: 'createReceipt(' + rmaCase + ', \'' + stTriggerSLUrl + '\', \'' + stRecId + '\')'
                        });
                    }
                }
            }
        }
    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(scriptContext) {

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(scriptContext) {

    }

    return {
        beforeLoad: beforeLoad,
        // beforeSubmit: beforeSubmit,
        // afterSubmit: afterSubmit
    };

});
