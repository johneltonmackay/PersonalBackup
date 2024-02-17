/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search'],
    
    (record, search) => {

        const STATIC_SUBLISTNAME = 'item';

        const beforeSubmit = (scriptContext) => {
            log.debug("CONTEXT: ", scriptContext.type);
            let newRecord = scriptContext.newRecord;
            var recType = newRecord.type;
            if (recType == 'billingschedule') {
                if (scriptContext.type == scriptContext.UserEventType.CREATE) {
                    scriptContext.newRecord.setValue({
                    fieldId: 'ispublic',
                    value: true
                    
                    })
                }
            } 
        }

        const afterSubmit = (scriptContext) => {
            try {
                log.debug("CONTEXT: ", scriptContext.type);
                if (scriptContext.type === scriptContext.UserEventType.CREATE || scriptContext.type === scriptContext.UserEventType.EDIT) {
                    let newRecord = scriptContext.newRecord;
                    var recType = newRecord.type;
                    let strId = newRecord.id;
                    var blnFlowControl = true
                    var blnValidator = null
                    if (newRecord) {
                        if (recType === 'salesorder') {
                            let intCreatedFrom = newRecord.getValue({
                                fieldId: 'createdfrom',
                            });
                            log.debug("intCreatedFrom", intCreatedFrom);
    
                            if (intCreatedFrom) {
                                blnValidator = searchInvoice(intCreatedFrom)
                                if (blnValidator){
                                    let objRecord = record.load({
                                        type: 'estimate',
                                        id: intCreatedFrom,
                                        isDynamic: true,
                                    });
                                    log.debug("objRecord", objRecord);
                                    if (objRecord){
                                        blnFlowControl = false
                                        recType = objRecord.type;
                                        processData(objRecord, recType)
                                    }
                                }
                            } else {
                                blnValidator = searchInvoice(strId)
                                if (blnValidator){
                                    let objRecord = record.load({
                                        type: 'salesorder',
                                        id: strId,
                                        isDynamic: true,
                                    });
                                    log.debug("objRecord", objRecord);
                                    if (objRecord){
                                        processData(objRecord, recType)
                                    }
                                }
                            }
                        } 

                        if (recType === 'estimate' && blnFlowControl == true){
                            blnValidator = searchInvoice(strId)
                            if (blnValidator){
                                let objRecord = record.load({
                                    type: 'estimate',
                                    id: strId,
                                    isDynamic: true,
                                });
                                log.debug("objRecord", objRecord);
                                if (objRecord){
                                    processData(objRecord, recType)
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                log.error('afterSubmit Error', err.message);
            }
        };
    
        // Private Function

        const processData = (objRecord, recType) => {
            try {
                intBillSched = null
                var numLines = objRecord.getLineCount({
                    sublistId: STATIC_SUBLISTNAME
                });
                log.debug("numLines", numLines)
                for (var i = 0;  i < numLines; i++) {
                    objRecord.selectLine({
                        sublistId: STATIC_SUBLISTNAME,
                        line: i
                    });
                    var intBillingSchedule = objRecord.getSublistValue({
                        sublistId: STATIC_SUBLISTNAME,
                        fieldId: 'billingschedule',
                        line: i 
                    });
                    log.debug("intBillingSchedule", intBillingSchedule)
                    if (intBillingSchedule){
                        intBillSched = intBillingSchedule
                    }
                    var blnApplyBillingSchedule = objRecord.getSublistValue({
                        sublistId: STATIC_SUBLISTNAME,
                        fieldId: 'custcol_eaz_apply_billing_schedule',
                        line: i 
                    })
                    log.debug("blnApplyBillingSchedule", blnApplyBillingSchedule)
                    if (blnApplyBillingSchedule){
                        if (intBillSched){
                            objRecord.setCurrentSublistValue({
                                sublistId: STATIC_SUBLISTNAME,
                                fieldId: 'billingschedule',
                                value: intBillSched
                            })
                        }
                    }
                    objRecord.commitLine({
                        sublistId: STATIC_SUBLISTNAME
                    });
                }
                let strId = objRecord.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                })
                log.debug(`afterSubmit Updated ${recType} `, strId)
            } catch (e) {
                log.error('processData Error', e.message);
            }
        }

        const searchInvoice = (intCreatedFrom) => {
            let arrTransactionId = [];
            let blnReturnValue = true
            try {
                let objTransactionSearch = search.create({
                    type: 'invoice',
                    filters: [
                        ['type', 'anyof', 'CustInvc'],
                        'AND'
                        ['createdfrom', 'anyof', intCreatedFrom],
                        'AND'
                        ['mainline', 'is', 'T'],
                    ],
                    columns: [
                        search.createColumn({ name: 'internalid' }),
                    ]
                });
                
                var searchResultCount = objTransactionSearch.runPaged().count;
                if (searchResultCount != 0) {
                    var pagedData = objTransactionSearch.runPaged({pageSize: 1000});
                    for (var i = 0; i < pagedData.pageRanges.length; i++) {
                        var currentPage = pagedData.fetch(i);
                        var pageData = currentPage.data;
                        if (pageData.length > 0) {
                            for (var pageResultIndex = 0; pageResultIndex < pageData.length; pageResultIndex++) {
                                arrTransactionId.push({
                                    invoiceId: pageData[pageResultIndex].getValue({name: 'internalid'}),
                                });
                            }
                        }
                    }
                }
            } catch (err) {
                log.error('searchInvoice', err.message);
            }
            log.debug("searchInvoice", arrTransactionId)
            if (arrTransactionId.length > 0 && arrTransactionId){
                blnReturnValue = false
            }
            return blnReturnValue;
        }

        return { beforeSubmit, afterSubmit };
    });

    