/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/query', 'N/runtime', 'N/file',
    '../../Library/suiteql.js', '../../Library/htmllib/moment/momentjs.js', '../../Atlassian/api/lib/mapper.js', './lib/adap_refresh.js', '../../Opportunity/UserEvent/lib/ada_ue_helper.js'],
    /**
 * @param{currentRecord} currentRecord
 * @param{query} query
 * @param{record} record
 */
    (record, query, runtime, file,
        suiteql, moment, mapper, refreshHelper, libContactHelper) => {

        const getInputData = (inputContext) => {
            var objScript = runtime.getCurrentScript()
            var intEstimateId = objScript.getParameter({ name: 'custscript_adap_atl_refresh_estimate_id' })
            var arrCartLines = suiteql.search({
                type: 'toRefreshQuote',
                params: {
                    estid: intEstimateId
                }
            });

            log.debug('arrCartLines', arrCartLines)

            var arrCartHeader = [];

            for (const cartItem of arrCartLines) {
                var intCartHeaderIndx = arrCartHeader.findIndex((obj) => {
                    return obj.cartid == cartItem.cartid
                });
                var objLineItem = {
                    cartitemid: cartItem.cartitemid,
                    productitemid: cartItem.productitemid,
                    itemdiscountpercent: cartItem.itemdiscountpercent,
                    productdescription:cartItem.productdescription
                };

                if (intCartHeaderIndx >= 0) {
                    arrCartHeader[intCartHeaderIndx].lines.push(objLineItem);
                } else {
                    arrCartHeader.push({
                        cartid: cartItem.cartid,
                        lines: [objLineItem],
                        nsjson: cartItem.nsjson,
                        atjson: cartItem.atjson,
                    });
                }
            }
            return arrCartHeader;
        }

        const map = (mapContext) => {
            log.debug('mapContext', mapContext);
            try {
                const objMapValue = JSON.parse(mapContext.value);
                log.debug('objMapValue', objMapValue);
                var objAtJson = JSON.parse(objMapValue.atjson);
                var objNsJson = JSON.parse(objMapValue.nsjson);
                var arrNSItems = refreshHelper.getNSItems({ atlQuote: objAtJson });

                //loop for Deletion
                log.debug('objNsJson.orderItems.length', objNsJson)
                log.debug('objNsJson.orderItems.length', objNsJson.orderItems)
                file.create({
                    name: 'test',
                    fileType: 'JSON',
                    contents: JSON.stringify(objMapValue),
                    folder: 382
                }).save();
                for (const nsQuoteItem of objNsJson.orderItems) {
                    var strNsProductId = refreshHelper.productIdParser(nsQuoteItem);
                    var intDeletingIndex = objAtJson.orderItems.findIndex((obj) => refreshHelper.productIdParser(obj) == strNsProductId)
                    if (intDeletingIndex < 0) {
                        var lineIndex = objMapValue.lines.findIndex((obj) => {
                            log.debug('obj.productitemid', obj.productitemid)
                            log.debug('strNsProductId', strNsProductId)
                            return obj.productitemid == strNsProductId
                        });
                        log.debug('objMapValue.lines[lineIndex]', objMapValue.lines[lineIndex]);
                        if (objMapValue.lines[lineIndex]) {
                            objMapValue.lines[lineIndex].action = 'delete';
                        }
                    }
                }
                log.debug('objMapValue.lines', objMapValue.lines);
                //loop for Add and Update
                log.debug('objAtJson.orderItems.length', objAtJson.orderItems);
                for (let atlQuoteItem of objAtJson.orderItems) {
                    log.debug('atlQuoteItem E', atlQuoteItem);
                    var strAtlProductId = refreshHelper.productIdParser({ ...atlQuoteItem });
                    var isATExists;
                    NsLoop:
                    for (const nsitem of objNsJson.orderItems) {
                        isATExists = objAtJson.orderItems.findIndex((obj) => refreshHelper.productIdParser(obj) == refreshHelper.productIdParser(nsitem));
                        if (isATExists >= 0) { break NsLoop }
                    }
                    log.debug('strAtlProductId',strAtlProductId)
                    var intLineItem = objMapValue.lines.findIndex((obj) => obj.productitemid == strAtlProductId);
                    var objItem = { ...atlQuoteItem };

                    if(intLineItem<0){
                        log.debug('atlQuoteItem.description',atlQuoteItem.description)
                        intLineItem = objMapValue.lines.findIndex((obj) => obj.productdescription == atlQuoteItem.description)
                    }

                    if (intLineItem >= 0) {
                        objItem = { ...atlQuoteItem, ...objMapValue.lines[intLineItem] };
                    }

                    log.debug('intLineItem', intLineItem);
                    // check item record in netsuite
                    objItem.totalExTax = objAtJson.totalExTax;
                    objItem.totalIncTax = objAtJson.totalIncTax;
                    objItem.totalTax = objAtJson.totalTax;

                    var intNSItemIndex = arrNSItems.findIndex((obj) => obj.productid == strAtlProductId);
                    objItem.itemId = arrNSItems[intNSItemIndex].id;

                    if (isATExists >= 0) {
                        objItem.action = 'update';
                        objMapValue.lines[intLineItem] = { ...objItem }
                    }

                    if (intLineItem < 0) {
                        objItem.productid = strAtlProductId;
                        objItem.action = 'add';
                        objItem.itemdiscountpercent = 0;
                        objMapValue.lines.push(objItem);
                    }

                    // objMapValue.nsjson = '';
                    objMapValue.atjson = JSON.stringify(objAtJson);
                }
                mapContext.write(objMapValue.cartid, objMapValue);
            } catch (e) {
                log.debug('MAP ERROR E:', e);
            }
        }

        const reduce = (reduceContext) => {
            log.debug('reduceContext', reduceContext.values);
            try {
                var arrCartItems = []
                var objCart = JSON.parse(reduceContext.values);
                var objCartItem;
                log.debug('objCart', objCart);
                file.create({
                    name: 'REDUCECONTEXT_REFRESH',
                    fileType: 'JSON',
                    contents: JSON.stringify(objCart),
                    folder: 382
                }).save();
                for (const lines of objCart.lines) {
                    lines.type = mapper.atlassianCartItem.id;
                    lines.cartId = objCart.cartid;
                    if (lines.action != 'delete' && lines.action) {
                        log.debug('lines', lines)
                        objCartItem = refreshHelper.crudCartItem(lines);
                    } else {
                        objCartItem = lines
                    }
                    if (lines.action) {
                        arrCartItems.push(objCartItem);
                    }
                }
                log.debug('calculateSummary', arrCartItems);
                var summary = refreshHelper.calculateSummary({ items: arrCartItems, cartid: objCart.cartid });
                log.debug('calculateSummary', arrCartItems);
                summary.quoteDataJson = JSON.stringify(JSON.parse(objCart.atjson));
                summary.quoteRefreshDataJson = '';
                var intNewCartId = refreshHelper.updateCart({ summary, cartid: objCart.cartid });

                log.debug('intNewCartId', intNewCartId);
                var objScript = runtime.getCurrentScript();
                var estid = objScript.getParameter({ name: mapper.mr.params.estimate });
                reduceContext.write({
                    key: estid,
                    value: {
                        cartid: objCart.cartid,
                        items: JSON.stringify(arrCartItems)
                    }
                });
            } catch (e) {
                log.debug('REDUCE ERROR E:', e);
            }
        }

        const summarize = (summaryContext) => {
            log.debug('summaryContext', summaryContext)
            var objScript = runtime.getCurrentScript();
            var estid = objScript.getParameter({ name: mapper.mr.params.estimate });
            try {

                log.debug('estid', estid);
                var arrItems = [];
                log.debug('summaryContext.output', summaryContext.output.iterator())

                summaryContext.output.iterator().each(function (key, value) {
                    log.debug('key', key);
                    log.debug('value', value);
                    var objResult = JSON.parse(value) || '{}';
                    log.debug('objResult', objResult);
                    var items = JSON.parse(objResult.items) || '[]';
                    for (const item of items) {
                        arrItems.push(item);
                    }
                    return true
                });
                log.debug('Summary', arrItems);

                var estimate = refreshHelper.updateEstimateRecord({
                    estimate: estid,
                    items: arrItems
                });

                log.debug('estimate', estimate);

                //create non existing technical contact, and attach to estimate
                libContactHelper.syncEstimateContactToJSON(estimate)

                summaryContext.output.iterator().each(function (key, value) {
                    var objResult = JSON.parse(value) || '{}';
                    var items = JSON.parse(objResult.items) || '[]';
                    for (const item of items) {
                        if (item.action == 'delete') {
                            refreshHelper.crudCartItem(item);
                        }
                    }
                    return true
                });

                log.debug('SUMMARIZE END', summaryContext);
            } catch (e) {
                record.submitFields({
                    type: 'estimate',
                    id: estid,
                    values: {
                        'custbody_adap_atl_refresh_status': 'FAILED'
                    }
                })
                log.debug('SUMARRY ERROR:', e)
            }
        }

        const productIdParser = (parseText) => {
            removeWhiteSpace = (str) => str.replace(/[^A-Z0-9]/ig, "").toUpperCase()
            if (typeof parseText == 'object') {
                return parseText.platform + '_' + (removeWhiteSpace(parseText.productName).replaceAll(parseText.platform, ''))
            } else {
                var platform = parseText.split('_')[0]
                return platform + '_' + (parseText.replaceAll('_', '').replaceAll(platform, ''))
            }
        }

        return { getInputData, map, reduce, summarize }

    })
