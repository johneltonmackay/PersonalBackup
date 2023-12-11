/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search'],
    /**
     * @param{record} record
     * @param{search} search
     */
    (record, search) => {
        const getInputData = (inputContext) => {
            let arrSoLineItems = [];
            try {
                let objItemSearch = search.create({
                    type: 'salesorder',
                    filters: [
                        ['type', 'anyof', 'SalesOrd'],
                        'AND',
                        ['trandate', 'notbefore', '06/11/2023'],
                        'AND',
                        ['status', 'anyof', 'SalesOrd:F', 'SalesOrd:H'],
                        'AND',
                        ['mainname', 'anyof', '1717'],
                        'AND',
                        ['mainline', 'is', 'F'],
                        'AND',
                        ['taxline', 'is', 'F'],
                        'AND',
                        ['shipcomplete', 'is', 'F'],
                        'AND',
                        ['custcol_anwb_warranty', 'is', 'F'],
                        'AND',
                        ['location.custrecord_anwb_auto_accu_purchase', 'is', 'T'],
                        'AND',
                        ['item.custitem_anwb_vervangend_item', 'noneof', '@NONE@'],
                        'AND',
                        ['item.custitem_anwb_category_1', 'anyof', '10'],
                        'AND',
                        ['item.custitem_anwb_category_2', 'anyof', '1'],
                        'AND',
                        ['item.custitem_anwb_category_3', 'anyof', '68'],
                        'AND',
                        ['custcol_anwb_auto_po_cls_created', 'is', 'F'],
                        'AND',
                        ['item.vendor', 'anyof', '1223'],
                        'AND',
                        ['custcol_anwb_warranty', 'is', 'F'],
                      ],
                    columns: [
                        search.createColumn({ name: 'internalid' }),
                        search.createColumn({ name: 'tranid' }),
                        search.createColumn({ name: 'custbody_anwb_kenteken' }),
                        search.createColumn({ name: 'custbody_anwb_incidentnr' }),
                        search.createColumn({ name: 'location' }),
                        search.createColumn({ name: 'custrecord_anwb_location_department', join: 'location' }),
                        search.createColumn({ name: 'custitem_anwb_vervangend_item', join: 'item' }),
                        search.createColumn({ name: 'cost', join: 'item' }),
                        search.createColumn({ name: 'custbody_anwb_wwi_formnr' }),
                        search.createColumn({ name: 'lineuniquekey' }),
                        ],

                });
                var searchResultCount = objItemSearch.runPaged().count;
                if (searchResultCount != 0) {
                    var pagedData = objItemSearch.runPaged({pageSize: 1000});
                    for (var i = 0; i < pagedData.pageRanges.length; i++) {
                        var currentPage = pagedData.fetch(i);
                        var pageData = currentPage.data;
                        if (pageData.length > 0) {
                            for (var pageResultIndex = 0; pageResultIndex < pageData.length; pageResultIndex++) {
                                arrSoLineItems.push({
                                    soId: pageData[pageResultIndex].getValue({name: 'internalid'}),
                                    soTranId: pageData[pageResultIndex].getValue({name: 'tranid'}),
                                    soKenteken: pageData[pageResultIndex].getValue({name: 'custbody_anwb_kenteken'}),
                                    soIncidentNr: pageData[pageResultIndex].getValue({name: 'custbody_anwb_incidentnr'}),
                                    soLocation: pageData[pageResultIndex].getValue({name: 'location'}),
                                    soLocationDepartment: pageData[pageResultIndex].getValue({
                                        name: 'custrecord_anwb_location_department',
                                        join: 'location'
                                    }),
                                    soItemVervangend: pageData[pageResultIndex].getValue({
                                        name: 'custitem_anwb_vervangend_item',
                                        join: 'item'
                                    }),
                                    soItemCost: pageData[pageResultIndex].getValue({
                                        name: 'cost',
                                        join: 'item'
                                    }),
                                    soWWI: pageData[pageResultIndex].getValue({name: 'custbody_anwb_wwi_formnr'}),
                                    soLineKey: pageData[pageResultIndex].getValue({name: 'lineuniquekey'}),
                                });
                            }
                        }
                    }
                }
            } catch (err) {
                log.error('searchRecord', err.message);
            }
            log.debug("getInputData: arrSoLineItems", arrSoLineItems)
            return arrSoLineItems;

        }

        const map = (mapContext) => {
            log.debug('map : mapContext', mapContext);
            let objMapValue = JSON.parse(mapContext.value)
            let intSoId = objMapValue.soId
            let intTranId = objMapValue.soTranId
            log.debug('intSoId', intSoId)
            if (intSoId && intTranId) {
                log.debug('intTranId', intTranId)
                try {
                    var recPO = record.create({
                        type: 'purchaseorder',
                        isDynamic: true,
                    });
                    recPO.setValue({
                        fieldId: 'customform',
                        value: 150
                    });
                    recPO.setValue({
                        fieldId: 'entity',
                        value: 1223
                    });
                    recPO.setValue({
                        fieldId: 'subsidiary',
                        value: 1
                    });
                    recPO.setValue({
                        fieldId: 'department',
                        value: objMapValue.soLocationDepartment
                    });
                    recPO.setValue({
                        fieldId: 'location',
                        value: objMapValue.soLocation
                    });
                    recPO.setValue({
                        fieldId: 'approvalstatus',
                        value: 2
                    });
                    recPO.setValue({
                        fieldId: 'custbody_anwb_linked_salesorder_po',
                        value: objMapValue.soId
                    });
                    recPO.setValue({
                        fieldId: 'custbody_anwb_kenteken',
                        value: objMapValue.soKenteken
                    });
                    recPO.setValue({
                        fieldId: 'custbody_anwb_incidentnr',
                        value: objMapValue.soIncidentNr
                    });
                    recPO.setValue({
                        fieldId: 'custbody_rfi_poform_po_submitter',
                        value: 3650
                    });
                    recPO.setValue({
                        fieldId: 'custbody_anwb_wwi_formnr',
                        value: objMapValue.soWWI
                    });
                    recPO.selectNewLine({
                        sublistId: 'item'
                    });
                    recPO.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        value: objMapValue.soItemVervangend
                    });
                    recPO.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'location',
                        value: objMapValue.soLocation
                    });   
                    recPO.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        value: objMapValue.soItemCost
                    });
                    recPO.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        value: objMapValue.soItemCost
                    }); 
                    recPO.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'expectedreceiptdate',
                        value: new Date()
                    }); 
                    recPO.commitLine({
                        sublistId: 'item'
                    });
                    var recordId = recPO.save();
                    log.debug('recordId', recordId)
                } catch (err) {
                    log.error('map', err.message);
                }
                mapContext.write({
                    key: objMapValue.soId,
                    value: objMapValue.soLineKey
                })
            }
        }

        const reduce = (reduceContext) => {
            log.debug('reduceContext', reduceContext)
            var reduceKey = reduceContext.key;
            var arrReduceValues = reduceContext.values;
            log.debug('reduceKey', reduceKey)
            log.debug('arrReduceValues', arrReduceValues)
            arrReduceValues.forEach(lineuniquekey => {
                var recSo = record.load({
                    type:record.Type.SALES_ORDER,
                    id:reduceKey,
                    isDynamic:true
                });
                var intLineSO = recSo.findSublistLineWithValue({
                    sublistId:'item',
                    fieldId:'lineuniquekey',
                    value: lineuniquekey
                })
                log.debug('reduce intLineSO', intLineSO)
                if (intLineSO != -1){
                    recSo.selectLine({
                        sublistId: 'item',
                        line: intLineSO
                    });
                    recSo.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_anwb_auto_po_cls_created',
                        value: true
                    });
                    recSo.commitLine({sublistId:'item'})
                }
                var intRecSoId = recSo.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                log.debug('reduce: intRecSoId',intRecSoId)        
            });

            
        }

        const summarize = (summaryContext) => {

        }

        return {getInputData, map, reduce, summarize}

    });
