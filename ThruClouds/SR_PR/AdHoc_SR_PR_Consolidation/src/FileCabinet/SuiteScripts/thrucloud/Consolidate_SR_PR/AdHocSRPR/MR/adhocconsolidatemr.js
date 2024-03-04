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
            INCOTERM: 'incoterm',
            LOCATION: 'location',
            ORDER_STATUS: 'orderstatus',
            TO_LOCATION: 'transferlocation',
            SUBSIDIARY_NAME: 'subsidiary',
            SUBLIST_NAME: 'item',
            QUANTITY: 'quantity',
            UNITS: 'units',
            CONSOLIDATED: 'custbody_conso',
            LINKTOCONSOLIDATED: 'custbody_linktoconso_pr_sr',
            ISCLOSED: 'isclosed',
            TRANSKEY: 'custbody_adhoc_trans_key',
        }
        const getInputData = (inputContext) => {
            try {
                var intSavedSearchId
                var suiteletParam = runtime.getCurrentScript().getParameter({name: 'custscript_suitelet_param'})
                let objSuitelet = JSON.parse(suiteletParam)
                log.debug('getInputData: objSuitelet', objSuitelet);
        
                if (objSuitelet.transtype == 'SR'){
                    intSavedSearchId = runtime.getCurrentScript().getParameter({name: 'custscript_adhoc_ss_sr_param'});
                } else if (objSuitelet.transtype == 'PR'){
                    intSavedSearchId = runtime.getCurrentScript().getParameter({name: 'custscript_adhoc_ss_pr_param'});
                }

                if (intSavedSearchId){
                    var arrSavedSearchResults = loadSavedSearchId(intSavedSearchId, objSuitelet) 
                    log.debug(`getInputData: arrSavedSearchResults ${Object.keys(arrSavedSearchResults).length}`, arrSavedSearchResults);
                    var consolidatedData = consolidateData(arrSavedSearchResults, objSuitelet.transKey)
                }
                log.debug(`getInputData: consolidatedData ${Object.keys(consolidatedData).length}`, consolidatedData);
                return consolidatedData;
            } catch (err) {
                log.error('getInputData', err.message);
            }
        }

        const map = (mapContext) => {
            log.debug('map : mapContext', mapContext);
            let objMapValue = JSON.parse(mapContext.value)
            try {
                var recPROjb = record.create({
                    type: objMapValue.recType,
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

                if (objMapValue.recType == 'transferorder'){
                    recPROjb.setText({
                        fieldId: STATIC_DATA.TO_LOCATION,
                        text: objMapValue.transferlocation
                    });
                    recPROjb.setValue({
                        fieldId: STATIC_DATA.INCOTERM,
                        value: 1
                    })

                    recPROjb.setValue({
                        fieldId: STATIC_DATA.ORDER_STATUS,
                        value: 'B' // PENDING FULFILLMENT
                    })
                }

                recPROjb.setValue({
                    fieldId: STATIC_DATA.CONSOLIDATED,
                    value: true
                });

                recPROjb.setValue({
                    fieldId: STATIC_DATA.TRANSKEY,
                    value: objMapValue.transKey
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

                    if (objMapValue.recType == 'transferorder'){
                        recPROjb.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount',
                            value: parseFloat(objMapValue.data[x].Amount)
                        });
                        
                        recPROjb.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            value: parseFloat(objMapValue.data[x]["Unit Cost"])
                        });
                    }
    
                    recPROjb.commitLine({
                        sublistId:  STATIC_DATA.SUBLIST_NAME,
                    });
                    
                }
                let newPRId = recPROjb.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                log.debug("map newPRId", newPRId)
                mapContext.write({
                    key: newPRId,
                    value: objMapValue
                })
            } catch (err) {
                log.error('map', err.message);
            }
        }

        const reduce = (reduceContext) => {
            log.debug('reduce : reduceContext', reduceContext);
            let objReduceValue = JSON.parse(reduceContext.values)
            var intNewPR = reduceContext.key;
            log.debug('reduce : objReduceValue', objReduceValue);
            let arrRecIds = objReduceValue.recordid
            let strRecType = objReduceValue.recType
            arrRecIds.forEach(data => {
                log.debug('reduce : arrRecIds data', data);
                try {
                    let objRecord = record.load({
                        type: strRecType,
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

        }

        const summarize = (summaryContext) => {

        }

        //PRIVATE FUNCTION
        const loadSavedSearchId = (intSavedSearchId, suiteletParam) => {
            try {
                let objSuiteletParam = suiteletParam
                log.debug('loadSavedSearchId: objSuiteletParam', objSuiteletParam)
                let dtFromDate = ""
                let dtToDate = ""
                let strFromLocation = ""
                let strToLocation = ""
                if (objSuiteletParam){
                    dtFromDate = objSuiteletParam.fromdate
                    dtToDate = objSuiteletParam.todate
                    strFromLocation = objSuiteletParam.fromlocation
                    strToLocation = objSuiteletParam.tolocation
                }
                let arrSearchResults = [];
                let objSavedSearch = search.load({
                    id: intSavedSearchId
                });

                let updatedFilters = objSavedSearch.filters.filter(filter => {
                    if (filter.name === 'trandate') { 
                        log.debug('Removing filter:', filter);
                        return false; 
                    }
                    return true; 
                });

                objSavedSearch.filters = updatedFilters;

                if (dtFromDate && dtToDate){
                    objSavedSearch.filters.push(
                        search.createFilter({
                            name:'trandate',
                            operator:'within',
                            values:[dtFromDate, dtToDate]
                        })
                    )
                }

                if (strFromLocation){
                    objSavedSearch.filters.push(
                        search.createFilter({
                            name:'location',
                            operator:'anyof',
                            values:[strFromLocation]
                        })
                    )
                }
    
                if (strToLocation){
                    objSavedSearch.filters.push(
                        search.createFilter({
                            name:'transferlocation',
                            operator:'anyof',
                            values:[strToLocation]
                        })
                    )
                }
                
                // log.debug('New Search Filter:', objSavedSearch.filters);

                objSavedSearch.columns.push(
                    search.createColumn({
                        name: 'internalid',
                        summary: search.Summary.GROUP,
                        label: 'recordid'
                    })
                )

                objSavedSearch.columns.push(
                    search.createColumn({
                        name: 'trandate',
                        summary: search.Summary.GROUP,
                        label: 'trandate'
                    })
                )

                objSavedSearch.columns.push(
                    search.createColumn({
                        name: 'recordtype',
                        summary: search.Summary.GROUP,
                        label: 'recordtype'
                    })
                )

                if (strToLocation){
                    objSavedSearch.columns.push(
                        search.createColumn({
                            name: 'formulatext',
                            formula: '{transferlocation}',
                            summary: search.Summary.GROUP,
                            label: 'transferlocation'
                        })
                    )
                }

                objSavedSearch.columns.push(
                    search.createColumn({
                        name: 'formulatext',
                        formula: '{location}',
                        summary: search.Summary.GROUP,
                        label: 'location'
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
                
            } catch (error) {
                log.error('loadSavedSearchId: error', error.message)
            }

        };

        const consolidateData = (arrSavedSearchResults, transKey) => {
            let consolidatedData = {};
            
            // Iterate through the original array
            arrSavedSearchResults.forEach((item) => {
                let key = JSON.stringify({
                    item: item.Item,
                    location: item.location,
                    units: item.Units,
                    recordtype: item.recordtype
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
                let location = item.location;
                let units = item.Units;
                let recordtype = item.recordtype;
                let transferlocation = "";

                if (recordtype == 'transferorder'){
                    transferlocation = item.transferlocation;
                }

                if (!groupedByOutlet[location]) {
                    groupedByOutlet[location] = {
                        recordid: recordid,
                        location: location,
                        units: units,
                        transKey: transKey,
                        recType: recordtype,
                        data: []
                    };
                    if (transferlocation) {
                        groupedByOutlet[location].transferlocation = transferlocation;
                    }
                }
                
                // Push the item to the data array of the corresponding outlet and recordid
                groupedByOutlet[location].data.push(item);
            });

            arrSavedSearchResults = groupedByOutlet;
        
            return arrSavedSearchResults
        }
        
        return {getInputData, map, reduce, summarize}

    });
