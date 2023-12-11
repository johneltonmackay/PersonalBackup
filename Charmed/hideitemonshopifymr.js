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
            let arrItemData = []
            let groupedData = {}
            let ringParentId
            try {
                let arrRingsResults = searchRings()
                if (arrRingsResults && arrRingsResults.length > 0){
                    arrRingsResults.forEach((item) => {
                      let parentId = item.parent;
                      if (!groupedData[parentId]) {
                        groupedData[parentId] = [];
                      }
                      groupedData[parentId].push({
                        parent: parentId,
                        data: item.data
                      });
                    });
                }
                log.debug('groupedData', groupedData)
                // Iterate over each group in groupedData
                for (let parentId in groupedData) {
                    if (groupedData.hasOwnProperty(parentId)) {
                        log.debug(`Group for parentId ${parentId}:`, groupedData[parentId]);
                
                        let filteredObj = {}; // Initialize filteredObj outside the loop
                        let counter = 0;
                        let filteredData = []
                        groupedData[parentId].forEach(data => {
                            filteredData.push(data)
                            ringParentId = parentId;
                            let intQty = data.stockLeft ? parseInt(data.stockLeft) : null;
                            if (intQty !== 0) {
                                counter++;
                            }
                        });
                
                        if (counter === 0) {
                            arrItemData = arrItemData.concat(filteredData)
                        }
                    }
                }
                
                arrItemData.forEach(element => {
                    log.debug('element', element)
                    
                });
                // let arrItemResults = searchItems()
                // if (arrItemResults && arrItemResults.length > 0){
                //     arrItemData = arrItemData.concat(arrItemResults)
                // }
                
                // log.debug("getInputData: arrItemData", arrItemData)
                return arrItemData;
            } catch (err) {
                log.error('getInputData', err.message);
            }
        }

        const map = (mapContext) => {
            // log.debug('map : mapContext', mapContext);
            let objMapValue = JSON.parse(mapContext.value)
        }

        const reduce = (reduceContext) => {

        }

        const summarize = (summaryContext) => {

        }

        //PRIVATE FUNCTION

        function searchRings() {
            let arrRingsData = [];
            try {
                let objRingSearch = search.create({
                    type: 'item',
                    filters: [
                        ['isinactive', 'is', 'F'],
                        'AND',
                        ['type', 'anyof', 'Assembly', 'InvtPart'],
                        'AND',
                        ['custitem_ca_jewelry_type', 'anyof', '14'],
                        'AND',
                        ['custitem_fa_shpfy_published_ca', 'anyof', '1'],
                        'AND',
                        ['custitemcustiteminventoryavail3pl_stor', 'lessthan', '3'],
                        'AND',
                        ['parent', 'noneof', '@NONE@'],
                        'AND',
                        ['custitem_fa_shpfy_tags', 'doesnotcontain', 'Coming'],
                    ],
                    columns: [
                        search.createColumn({name: 'internalid'}),
                        search.createColumn({ name: 'itemid' }),
                        search.createColumn({ name: 'parent' }),
                        search.createColumn({ name: 'custitem_ca_sku_code' }),
                        search.createColumn({ name: 'custitem_shopify_size_option' }),
                        search.createColumn({ name: 'custitem_ca_jewelry_type' }),
                        search.createColumn({ name: 'type' }),
                        search.createColumn({ name: 'custitemcustiteminventoryavail3pl_stor' }),
                        search.createColumn({ name: 'custitem_fa_shpfy_published_ca' }),
                    ],
                });
                var searchResultCount = objRingSearch.runPaged().count;
                if (searchResultCount != 0) {
                    var pagedData = objRingSearch.runPaged({pageSize: 1000});
                    for (var i = 0; i < pagedData.pageRanges.length; i++) {
                        var currentPage = pagedData.fetch(i);
                        var pageData = currentPage.data;
                        if (pageData.length > 0) {
                            for (var pageResultIndex = 0; pageResultIndex < pageData.length; pageResultIndex++) {
                                arrRingsData.push({
                                    parent: pageData[pageResultIndex].getValue({name: 'parent'}),
                                    data: {
                                        itemRingId: pageData[pageResultIndex].getValue({name: 'internalid'}),
                                        item: pageData[pageResultIndex].getValue({name: 'itemid'}),
                                        skucode: pageData[pageResultIndex].getValue({name: 'custitem_ca_sku_code'}),
                                        size: pageData[pageResultIndex].getValue({name: 'custitem_shopify_size_option'}),
                                        jewelType: pageData[pageResultIndex].getValue({name: 'custitem_ca_jewelry_type'}),
                                        itemType: pageData[pageResultIndex].getValue({name: 'type'}),
                                        stockLeft: pageData[pageResultIndex].getValue({name: 'custitemcustiteminventoryavail3pl_stor'}),
                                        isPublished: pageData[pageResultIndex].getValue({name: 'custitem_fa_shpfy_published_ca'}),
                                    }
                                });
                            }
                        }
                    }
                }
                log.debug("searchRings: arrRingsData", arrRingsData)
                return arrRingsData;
            } catch (err) {
                log.error('searchRings', err.message);
            }
        }

        function searchItems() {
            let arrItemsData = [];
            try {
                let objItemsSearch = search.create({
                    type: 'item',
                    filters: [
                        ['isinactive', 'is', 'F'],
                        'AND',
                        ['type', 'anyof', 'Assembly', 'InvtPart'],
                        'AND',
                        ['custitem_ca_jewelry_type', 'noneof', '14', '112', '107', '108', '109', '110', '111'],
                        'AND',
                        ['custitemcustiteminventoryavail3pl_stor', 'lessthan', '3'],
                        'AND',
                        ['custitem_fa_shpfy_published_ca', 'anyof', '1'],
                        'AND',
                        ['custitem_fa_shpfy_tags', 'doesnotcontain', 'Coming'],
                    ],
                    columns: [
                        search.createColumn({name: 'internalid'}),
                        search.createColumn({ name: 'itemid' }),
                        search.createColumn({ name: 'parent' }),
                        search.createColumn({ name: 'custitem_ca_sku_code' }),
                        search.createColumn({ name: 'custitem_shopify_size_option' }),
                        search.createColumn({ name: 'custitem_ca_jewelry_type' }),
                        search.createColumn({ name: 'type' }),
                        search.createColumn({ name: 'custitemcustiteminventoryavail3pl_stor' }),
                        search.createColumn({ name: 'custitem_fa_shpfy_published_ca' }),
                    ],
                });
                var searchResultCount = objItemsSearch.runPaged().count;
                if (searchResultCount != 0) {
                    var pagedData = objItemsSearch.runPaged({pageSize: 1000});
                    for (var i = 0; i < pagedData.pageRanges.length; i++) {
                        var currentPage = pagedData.fetch(i);
                        var pageData = currentPage.data;
                        if (pageData.length > 0) {
                            for (var pageResultIndex = 0; pageResultIndex < pageData.length; pageResultIndex++) {
                                arrItemsData.push({
                                    parent: pageData[pageResultIndex].getValue({name: 'parent'}),
                                    data: {
                                        itemRingId: pageData[pageResultIndex].getValue({name: 'internalid'}),
                                        item: pageData[pageResultIndex].getValue({name: 'itemid'}),
                                        skucode: pageData[pageResultIndex].getValue({name: 'custitem_ca_sku_code'}),
                                        size: pageData[pageResultIndex].getValue({name: 'custitem_shopify_size_option'}),
                                        jewelType: pageData[pageResultIndex].getValue({name: 'custitem_ca_jewelry_type'}),
                                        itemType: pageData[pageResultIndex].getValue({name: 'type'}),
                                        stockLeft: pageData[pageResultIndex].getValue({name: 'custitemcustiteminventoryavail3pl_stor'}),
                                        isPublished: pageData[pageResultIndex].getValue({name: 'custitem_fa_shpfy_published_ca'}),
                                    }
                                    
                                });
                            }
                        }
                    }
                }
                log.debug("searchItems: arrItemsData", arrItemsData)
                return arrItemsData;
            } catch (err) {
                log.error('searchItems', err.message);
            }
        }

        return {getInputData, map, reduce, summarize}

    });
