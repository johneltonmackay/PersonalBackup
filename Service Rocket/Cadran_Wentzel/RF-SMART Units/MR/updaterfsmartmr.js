        /**
         * @NApiVersion 2.1
         * @NScriptType MapReduceScript
         */
        define(['N/error', 'N/record', 'N/runtime', 'N/search'],
            /**
         * @param{error} error
         * @param{record} record
         * @param{runtime} runtime
         * @param{search} search
         */
            (error, record, runtime, search) => {

                const getInputData = (inputContext) => {
                    let arrRFSData = searchRFS()
                    let arrUnitTypes = searchUnitType()

                    arrRFSData.forEach(rfsData => {
                        let intItemId = rfsData.itemId
                        let strUnitId = rfsData.unit
                        arrUnitTypes.forEach(unitData => {
                            let strName = unitData.name
                            let strUnitName = unitData.unitName
                            if (strName == intItemId && strUnitId == strUnitName){
                                // log.debug('getInputData baseUnit', unitData.baseUnit)
                                // log.debug('getInputData rate', unitData.rate)
                                rfsData.rate = unitData.rate
                                rfsData.isbasedunit = unitData.baseUnit
                            }
                        });
                    });

                    
                    return arrRFSData;
                }

                const map = (mapContext) => {
                    let objMapValue = JSON.parse(mapContext.value)
                    let intRFSId = objMapValue.rfsId
                    let blnBaseUnit = objMapValue.isbasedunit
                    let intRate = objMapValue.rate
                    if (intRFSId){
                        record.submitFields({
                            type: 'customrecord_rfs_multiupc',
                            id: intRFSId,
                            values: {
                                custrecord_is_base_unit: blnBaseUnit,
                                custrecord_rate: intRate ? parseFloat(intRate) : null,
                            }
                        });
                        log.debug('map : intRFSId updated', intRFSId);
                    }
                }

                const reduce = (reduceContext) => {
                    
                }

                const summarize = (summaryContext) => {
                    
                }
                //Private Function
                const searchRFS = () => {
                    let arrRFSUPC = [];
                    try {
                        let objRFSSearch = search.create({
                            type: 'customrecord_rfs_multiupc',
                            filters: [
                                ['isinactive', 'is', 'F'],
                                'AND',
                                ['custrecord_rfs_multiupc_item.custitem_wnz_export_to_pim', 'is', 'T'],
                                // 'AND',
                                // ['internalid', 'anyof', '11622'],
                              ],
                            columns: [
                                search.createColumn({ name: 'internalid' }),
                                search.createColumn({ name: 'itemid', join: 'custrecord_rfs_multiupc_item'}),
                                search.createColumn({ name: 'displayname', join: 'custrecord_rfs_multiupc_item' }),
                                search.createColumn({ name: 'custrecord_rfs_multiupc_upc' }),
                                search.createColumn({ name: 'custrecord_rfs_multiupc_unit' }),
                                search.createColumn({ name: 'custrecord_rate' }),
                                search.createColumn({ name: 'custrecord_is_base_unit' }),
                            ],
        
                        });
                        var searchResultCount = objRFSSearch.runPaged().count;
                        if (searchResultCount != 0) {
                            var pagedData = objRFSSearch.runPaged({pageSize: 1000});
                            for (var i = 0; i < pagedData.pageRanges.length; i++) {
                                var currentPage = pagedData.fetch(i);
                                var pageData = currentPage.data;
                                if (pageData.length > 0) {
                                    for (var pageResultIndex = 0; pageResultIndex < pageData.length; pageResultIndex++) {
                                        arrRFSUPC.push({
                                            rfsId: pageData[pageResultIndex].getValue({name: 'internalid'}),
                                            itemId: pageData[pageResultIndex].getValue({
                                                name: 'itemid',
                                                join: 'custrecord_rfs_multiupc_item'
                                            }),
                                            displayName: pageData[pageResultIndex].getValue({
                                                name: 'displayname',
                                                join: 'custrecord_rfs_multiupc_item'
                                            }),
                                            upc: pageData[pageResultIndex].getValue({name: 'custrecord_rfs_multiupc_upc'}),
                                            unit: pageData[pageResultIndex].getText({name: 'custrecord_rfs_multiupc_unit'}),
                                            rate: pageData[pageResultIndex].getValue({name: 'custrecord_rate'}),
                                            isbasedunit: pageData[pageResultIndex].getValue({name: 'custrecord_is_base_unit'}),
                                        });
                                    }
                                }
                            }
                        }
                        log.debug("getInputData: arrRFSUPC", arrRFSUPC)
                        return arrRFSUPC;
                    } catch (err) {
                        log.error('searchRecord', err.message);
                    }
                }

                const searchUnitType= () => {
                    let arrUnitTypes = [];
                    try {
                        let objUnitTypeSearch = search.create({
                            type: 'unitstype',
                            filters: [],
                            columns: [
                                search.createColumn({ name: 'internalid' }),
                                search.createColumn({ name: 'unitname' }),
                                search.createColumn({ name: 'baseunit' }),
                                search.createColumn({ name: 'conversionrate' }),
                                search.createColumn({ name: 'name' }),
                                search.createColumn({ name: 'pluralname' }),
                                search.createColumn({ name: 'pluralabbreviation' }),
                            ],
        
                        });
                        var searchResultCount = objUnitTypeSearch.runPaged().count;
                        if (searchResultCount != 0) {
                            var pagedData = objUnitTypeSearch.runPaged({pageSize: 1000});
                            for (var i = 0; i < pagedData.pageRanges.length; i++) {
                                var currentPage = pagedData.fetch(i);
                                var pageData = currentPage.data;
                                if (pageData.length > 0) {
                                    for (var pageResultIndex = 0; pageResultIndex < pageData.length; pageResultIndex++) {
                                        arrUnitTypes.push({
                                            unitTypeId: pageData[pageResultIndex].getValue({name: 'internalid'}),
                                            unitName: pageData[pageResultIndex].getValue({name: 'unitname'}),
                                            baseUnit: pageData[pageResultIndex].getValue({name: 'baseunit'}),
                                            rate: pageData[pageResultIndex].getValue({name: 'conversionrate'}),
                                            name: pageData[pageResultIndex].getValue({name: 'name'}),
                                            pluralName: pageData[pageResultIndex].getValue({name: 'pluralname'}),
                                            pluralAbb: pageData[pageResultIndex].getValue({name: 'pluralabbreviation'}),
                                        });
                                    }
                                }
                            }
                        }
                        // log.debug("getInputData: arrUnitTypes", arrUnitTypes)
                        return arrUnitTypes;
                    } catch (err) {
                        log.error('searchRecord', err.message);
                    }
                }
            
                return {getInputData, map, reduce, summarize}

            });
