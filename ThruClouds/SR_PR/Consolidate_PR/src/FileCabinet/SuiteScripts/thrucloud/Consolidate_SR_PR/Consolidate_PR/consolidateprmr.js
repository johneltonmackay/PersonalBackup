/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search', 'N/runtime', 'N/email'],
    /**
     * @param{record} record
     * @param{search} search
     */
    (record, search, runtime, email) => {
        const  STATIC_DATA = {
            SUBSIDIARY: 3,
            LOCATION: 'location',
            SUBSIDIARY_NAME: 'subsidiary',
            SUBLIST_NAME: 'item',
            QUANTITY: 'quantity',
            UNITS: 'units',
            CONSOLIDATED: 'custbody_conso',
            LINKTOCONSOLIDATED: 'custbody_linktoconso_pr_sr',
            ISCLOSED: 'isclosed'
        }
        const getInputData = (inputContext) => {
            var intSavedSearchId = runtime.getCurrentScript().getParameter({name: 'custscript_saved_search_param'});

            try {
                if (intSavedSearchId){
                    var arrSavedSearchResults = loadSavedSearchId(intSavedSearchId) 
                    log.debug(`getInputData: arrSavedSearchResults ${Object.keys(arrSavedSearchResults).length}`, arrSavedSearchResults);
                    var consolidatedData = consolidateData(arrSavedSearchResults)
                }
            } catch (err) {
                log.error('getInputData', err.message);
            }

            log.debug(`getInputData: consolidatedData ${Object.keys(consolidatedData).length}`, consolidatedData);
            return consolidatedData;

        }

        const map = (mapContext) => {
            log.debug('map : mapContext', mapContext);
            let objMapValue = JSON.parse(mapContext.value)
            try {
                var recPROjb = record.create({
                    type: record.Type.PURCHASE_REQUISITION,
                    isDynamic: true,
                });

                recPROjb.setValue({
                    fieldId: STATIC_DATA.SUBSIDIARY_NAME,
                    value: STATIC_DATA.SUBSIDIARY
                });

                recPROjb.setText({
                    fieldId: STATIC_DATA.LOCATION,
                    text: objMapValue.location
                });

                recPROjb.setValue({
                    fieldId: STATIC_DATA.CONSOLIDATED,
                    value: true
                });

                for (let x=0; x < objMapValue.data.length; x++){
                    recPROjb.selectNewLine({
                        sublistId: STATIC_DATA.SUBLIST_NAME
                    });
                    recPROjb.setCurrentSublistText({
                        sublistId: STATIC_DATA.SUBLIST_NAME,
                        fieldId: STATIC_DATA.SUBLIST_NAME,
                        text: objMapValue.data[x].Item
                    });
                    recPROjb.setCurrentSublistValue({
                        sublistId: STATIC_DATA.SUBLIST_NAME,
                        fieldId: STATIC_DATA.QUANTITY,
                        value: objMapValue.data[x].Quantity
                    });
                    recPROjb.setCurrentSublistValue({
                        sublistId: STATIC_DATA.SUBLIST_NAME,
                        fieldId: STATIC_DATA.UNITS,
                        value: objMapValue.data[x].Units
                    });
                    recPROjb.commitLine({
                        sublistId:  STATIC_DATA.SUBLIST_NAME,
                    });
                }
                let newPRId = recPROjb.save({
                    ignoreMandatoryFields: true
                });
                log.debug("map newPRId", newPRId)
                mapContext.write({
                    key: newPRId,
                    value: objMapValue.recordid
                })
            } catch (err) {
                log.error('map', err.message);
            }
        }

        const reduce = (reduceContext) => {
            log.debug('reduce : reduceContext', reduceContext);
            let arrOrigPRId = JSON.parse(reduceContext.values)
            var intNewPR = reduceContext.key;
            log.debug('reduce : arrOrigPRId', arrOrigPRId);
            arrOrigPRId.forEach(data => {
                log.debug('reduce : arrOrigPRId data', data);
                try {
                    let objRecord = record.load({
                        type: record.Type.PURCHASE_REQUISITION,
                        id: data,
                        isDynamic: true,
                    });
                    log.debug('reduce : objRecord', objRecord);
                    if (objRecord){
                        objRecord.setValue({
                            fieldId: STATIC_DATA.LINKTOCONSOLIDATED,
                            value: intNewPR
                        });
                        var numLines = objRecord.getLineCount({
                            sublistId: STATIC_DATA.SUBLIST_NAME
                        });
                        if (numLines > 0) {
                            for (var x = 0; x < numLines; x++) {
                                objRecord.selectLine({
                                    sublistId: STATIC_DATA.SUBLIST_NAME,
                                    line: x
                                });
                                objRecord.setCurrentSublistValue({
                                    sublistId: STATIC_DATA.SUBLIST_NAME,
                                    fieldId: STATIC_DATA.ISCLOSED,
                                    value: true
                                });
                                objRecord.commitLine({
                                    sublistId: STATIC_DATA.SUBLIST_NAME
                                });
                            }
                            let recordId = objRecord.save()
                            log.debug('reduce OrigPR recordId Updated', recordId)
                        }
                    }        
                } catch (err) {
                    log.error('reduce', err.message);
                }
            });

            // var baseURL = 'https://8154337.app.netsuite.com/app';
            // var records = {transaction : intNewPR}
            // var body = 'A Purchase Requisition has been made by a scheduled script, Purchase Requisition Record Id: '+intNewPR; 
            // var recordLink = baseURL + '/accounting/transactions/purchreq.nl?id=' + intNewPR;
    
            // email.send({
            //     author: 45,
            //     recipients: ['ellen@thrucloudsolutions.com'],
            //     subject: 'Purchase Requisition has been Created',
            //     body: body + ' ' + recordLink,
            //     relatedRecords: records
            // });
        }

        const summarize = (summaryContext) => {

        }

        //PRIVATE FUNCTION
        const loadSavedSearchId = (intSavedSearchId) => {
            let arrSearchResults = [];
            let objSavedSearch = search.load({
                id: intSavedSearchId
            });

            objSavedSearch.columns.push(
                search.createColumn({
                    name: 'internalid',
                    summary: search.Summary.GROUP,
                    label: 'recordid'
                })
            )
            
            let searchResultCount = objSavedSearch.runPaged().count;
        
            if (searchResultCount !== 0) {
                let pagedData = objSavedSearch.runPaged({ pageSize: 1000 });
        
                for (let i = 0; i < pagedData.pageRanges.length; i++) {
                    let currentPage = pagedData.fetch(i);
                    let pageData = currentPage.data;
                    var pageColumns = currentPage.data[0].columns;
                    if (pageData.length > 0) {
                        for (let pageResultIndex = 0; pageResultIndex < pageData.length; pageResultIndex++) {
                            let objData = {};
                            pageColumns.forEach(function (result) {
                                let resultLabel = result.label;
                                objData[resultLabel] = pageData[pageResultIndex].getValue(result)
                            })
                            arrSearchResults.push(objData);
                        }
                    }   
                }
            }
            return arrSearchResults;
        };

        const consolidateData = (arrSavedSearchResults) => {
            let consolidatedData = {};
            
            // Iterate through the original array
            arrSavedSearchResults.forEach((item) => {
                let key = JSON.stringify({
                    item: item.Item,
                    location: item.Outlet,
                    units: item.Units
                });

                let intQuantity = parseFloat(item.Quantity);

                if (consolidatedData[key]) {
                    // If the key already exists, update the values accordingly
                    consolidatedData[key].Quantity += intQuantity;
                    consolidatedData[key].recordid.push(item.recordid); 
                } else {
                    // If the key doesn't exist, add a new entry with the current item
                    consolidatedData[key] = { ...item, recordid: [item.recordid]};
                    consolidatedData[key].Quantity = intQuantity;
                }
            });
            
            // Convert the object back to an array
            let consolidatedArray = Object.values(consolidatedData);

            let groupedByOutlet = {};

            consolidatedArray.forEach(item => {
                let recordid = item.recordid;
                let location = item.Outlet;
                let units = item.Units;

                if (!groupedByOutlet[location]) {
                    groupedByOutlet[location] = {
                        recordid: recordid,
                        location: location,
                        units: units,
                        data: []
                    };
                }
                // Push the item to the data array of the corresponding outlet and recordid
                groupedByOutlet[location].data.push(item);
            });

            arrSavedSearchResults = groupedByOutlet;
        
            return arrSavedSearchResults
        }
        
        return {getInputData, map, reduce, summarize}

    });
