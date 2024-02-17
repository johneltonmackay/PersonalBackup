    /**
     * @NApiVersion 2.1
     * @NScriptType UserEventScript
     */
    define(['N/record', 'N/ui/serverWidget', 'N/search'],
        /**
         * @param{record} record
         * @param{serverWidget} serverWidget
         */
        (record, serverWidget, libMapper, search) => {
            const beforeLoad = (scriptContext) => {
                const STATIC_DATA = {
                    SUBLIST_ID: 'item',
                    SORTED_ITEM: 'Sorted Items',
                    PRINT: 'print',
                    ITEM: 'item',
                    AMOUNT: 'amount',
                    RATE: 'rate',
                    BILLING_SCHEDULE: 'billingschedule',
                    CREATED_FROM: 'createdfrom',
                    LINE_ID: 'line',
                    ORDER_LINE_ID: 'orderline',
                    ITEM_DESCRIPTION: 'description',
                    ITEM_RATE: 'rate',
                    ITEM_TAX_RATE: 'taxrate1',
                    ITEM_QTY: 'quantity'
                };

                if (scriptContext.type == STATIC_DATA.PRINT) {
                    let objInvoiceRec = scriptContext.newRecord;
                    let intInvoiceId = objInvoiceRec.id;
                    let arrSOSublistItems = [];
                    let arrInvSublistItems = [];
                    let arrGetBillSchedData = [];
                    let intCreatedFrom = objInvoiceRec.getValue({
                        fieldId: STATIC_DATA.CREATED_FROM
                    })
                    log.debug("intInvoiceId", intInvoiceId)
                    log.debug("intCreatedFrom", intCreatedFrom)
                    if (intCreatedFrom){
                        let objRecord = record.load({
                            type: 'salesorder',
                            id: intCreatedFrom,
                            isDynamic: true,
                        });
                        log.debug("objRecord", objRecord)
                        if (objRecord){
                            let lineCount = objRecord.getLineCount(STATIC_DATA.SUBLIST_ID);
                            let sublistFieldNames = [
                                STATIC_DATA.ITEM,
                                STATIC_DATA.BILLING_SCHEDULE,
                                STATIC_DATA.LINE_ID,
                            ];
                            for (let lineIndex = 0; lineIndex < lineCount; lineIndex++) {
                                const lineValues = {};
                                for (let sublistField of sublistFieldNames) {
                                    lineValues[sublistField] = objRecord.getSublistValue({
                                        sublistId: STATIC_DATA.SUBLIST_ID,
                                        fieldId: sublistField,
                                        line: lineIndex
                                    });
                                }
                                arrSOSublistItems.push(lineValues);
                            }
                        }
                    }
                    log.debug('SO arrSOSublistItems', arrSOSublistItems)

                    if (objInvoiceRec){
                        log.debug("objInvoiceRec", objInvoiceRec)
                        if (objInvoiceRec){
                            let lineCount = objInvoiceRec.getLineCount(STATIC_DATA.SUBLIST_ID);
                            let sublistFieldNames = [
                                STATIC_DATA.ITEM,
                                STATIC_DATA.AMOUNT,
                                STATIC_DATA.LINE_ID,
                                STATIC_DATA.ITEM_DESCRIPTION,
                                STATIC_DATA.ITEM_RATE,
                                STATIC_DATA.ITEM_TAX_RATE,
                                STATIC_DATA.ITEM_QTY
                            ];
                            for (let lineIndex = 0; lineIndex < lineCount; lineIndex++) {
                                const lineValues = {};
                                for (let sublistField of sublistFieldNames) {
                                    lineValues[sublistField] = objInvoiceRec.getSublistValue({
                                        sublistId: STATIC_DATA.SUBLIST_ID,
                                        fieldId: sublistField,
                                        line: lineIndex
                                    });
                                }
                                arrInvSublistItems.push(lineValues);
                            }
                        }
                    }
                    log.debug('INV arrInvSublistItems', arrInvSublistItems)

                    arrInvSublistItems.forEach(data => {
                        let consolidatedData = getBillingScheduleArrays(arrSOSublistItems, data)
                        arrGetBillSchedData.push(consolidatedData)

                    });
                    log.debug('arrGetBillSchedData', arrGetBillSchedData)
                    
                    let arrConsolidatedData = consolidatedArray(arrGetBillSchedData)
                    log.debug('arrConsolidatedData', arrConsolidatedData)

                    if(arrConsolidatedData.length > 0 && arrConsolidatedData){
                        record.submitFields({
                            type: record.Type.INVOICE,
                            id: intInvoiceId,
                            values: {
                                custbody_print_pdf_object: JSON.stringify(arrConsolidatedData)
                            }
                        })
                    }
                }
            }
            

            //Private Function

            const getBillingScheduleArrays = (arrSOSublistItems, data) => {
                let invoiceItemData = data.item
                let consolidatedData = {};
                arrSOSublistItems.forEach((item) => {
                    let salesOrderItem = item.item
                    let salesOrderBillSched = item.billingschedule
                    if (invoiceItemData == salesOrderItem){
                        consolidatedData.item = invoiceItemData;
                        consolidatedData.description = data.description;
                        consolidatedData.amount =  parseFloat(data.amount);
                        consolidatedData.taxrate1 = data.taxrate1;
                    
                        if (salesOrderBillSched) {
                            consolidatedData.billingschedule = salesOrderBillSched;
                            consolidatedData.rate = "";
                            consolidatedData.qty = "";
                        } else {
                            consolidatedData.rate = parseFloat(data.rate);
                            consolidatedData.qty = data.quantity;
                        }
                    }
                    
                });
                log.debug('getBillingScheduleArrays consolidatedData', consolidatedData)
                return consolidatedData;
            };

            const consolidatedArray = (arrGetBillSchedData) => {
                
                let consolidatedData = {};
                arrGetBillSchedData.forEach((item) => {
                    let key = JSON.stringify({
                        billingschedule: item.billingschedule,
                    });
                  
                    if (consolidatedData[key]) {
                        // If the key already exists, update the values accordingly
                        if (item.amount !== undefined && item.amount !== "" && item.amount !== null) {
                          // Check if the "amount" property is present in the current item
                          consolidatedData[key].amount = (parseFloat(consolidatedData[key].amount) || 0) + parseFloat(item.amount);
                          consolidatedData[key].amount = consolidatedData[key].amount.toFixed(2);
                          consolidatedData[key].amount = parseFloat(consolidatedData[key].amount)
                        }
                        if (item.rate !== undefined && item.rate !== "" && item.rate !== null) {
                            // Check if the "rate" property is present in the current item
                            consolidatedData[key].rate = (parseFloat(consolidatedData[key].rate) || 0) + parseFloat(item.rate);
                            consolidatedData[key].rate = consolidatedData[key].rate.toFixed(2);
                            consolidatedData[key].rate = parseFloat(consolidatedData[key].rate)
                          }
                    } else {
                        // If the key doesn't exist, add a new entry with the current item
                        consolidatedData[key] = { ...item };
                    }
                  });
                let consolidatedArray = Object.values(consolidatedData)
                return consolidatedArray;
            };

           
            return { beforeLoad };
        });
