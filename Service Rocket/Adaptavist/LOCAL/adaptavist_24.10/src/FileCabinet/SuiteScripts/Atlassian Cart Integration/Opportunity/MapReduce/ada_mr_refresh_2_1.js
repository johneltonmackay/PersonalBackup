/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/query', 'N/runtime', 'N/file',
        '../../Library/suiteql.js', '../../Library/htmllib/moment/momentjs.js', '../../Atlassian/api/lib/mapper.js',
        './lib/adap_refresh.js', '../../Opportunity/UserEvent/lib/ada_ue_helper.js', 'N/https', '../../Opportunity/UserEvent/lib/ada_ue_validations_mapper.js'],

    (record, query, runtime, file,
     suiteql, moment, mapper, refreshHelper, libContactHelper, https, mapperHelper) => {

        const getInputData = (inputContext) => {
            var objScript = runtime.getCurrentScript()
            var intEstimateId = objScript.getParameter({name: 'custscript_adap_atl_refresh_estimate_id'})
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
                    productdescription: cartItem.productdescription
                };

                if (intCartHeaderIndx >= 0) {
                    arrCartHeader[intCartHeaderIndx].lines.push(objLineItem);
                } else {
                    arrCartHeader.push({
                        cartid: cartItem.cartid,
                        estid: intEstimateId,
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
                if (objMapValue.estid) {
                    let objEstimateRecord = record.load({
                        type: record.Type.ESTIMATE,
                        id: objMapValue.estid,
                    })

                    let strURL = mapperHelper.STR_ENVIRONMENT_ID + objMapValue.estid
                    strURL += '&mac=' + objEstimateRecord.getValue(mapper.estimate.fields.macAccount.id)
                    log.debug('strURL', strURL);
                    let response = https.get({
                        url: strURL
                    });
                    log.audit('response', response);
                    log.audit('response.body', response.body);

                    mapContext.write({key: objMapValue.cartid, value: {response: response.body, atlQuote: objAtJson}});
                }
            } catch (e) {
                log.debug('MAP ERROR E:', e);
            }
        }

        const reduce = (reduceContext) => {
            log.debug('reduceContext', reduceContext.values);
            try {
                var arrCartItems = []
                var arrCartDetails = JSON.parse(JSON.parse(reduceContext.values).response);
                log.audit('arrCartDetails', arrCartDetails)
                var objAtlQuote = JSON.parse(reduceContext.values).atlQuote
                log.audit('objAtlQuote', objAtlQuote)
                let intCartId = reduceContext.key
                var objScript = runtime.getCurrentScript();
                var estid = objScript.getParameter({name: mapper.mr.params.estimate});
                log.audit('estid', estid)
                let objEstimateRecord = record.load({
                    type: record.Type.ESTIMATE,
                    id: estid,
                    isDynamic: true
                })
                for (let objCart of arrCartDetails) {
                    //log.audit('objCart',objCart)
                    for (let strAction in objCart) {
                        //log.audit('strAction',strAction)
                        if (strAction == 'toUpdate') {
                            let arrToUpdate = []
                            arrToUpdate = objCart[strAction]
                            for (let objCartItemDetail of arrToUpdate) {
                                updateCartAndEstimate(objEstimateRecord, intCartId, objCartItemDetail)
                            }
                        } else if (strAction == 'toAdd') {
                            let arrToAdd = []
                            arrToAdd = objCart[strAction]
                            for (let objCartItemDetail of arrToAdd) {
                                addCartAndEstimate(objEstimateRecord, intCartId, objCartItemDetail, objAtlQuote)
                            }
                        }
                    }
                }

                let intEstimateSaved = objEstimateRecord.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                })
                log.debug('updated Estimate: ' + intEstimateSaved)
            } catch (e) {
                log.debug('REDUCE ERROR E:', e);
            }
        }

        const summarize = (summaryContext) => {
            log.debug('summaryContext', summaryContext)
            var objScript = runtime.getCurrentScript();
            var estid = objScript.getParameter({name: mapper.mr.params.estimate});
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


        const updateCartAndEstimate = (objEstimate, intCart, objCartDetail) => {
            if (objCartDetail) {
                log.debug('objCartDetail', objCartDetail)
                log.debug('objEstimate', objEstimate)
                log.debug('intCart', intCart)
                let intCartItemId = null;
                let objCalculatedCartDetail = refreshHelper.calculate(objCartDetail);
                log.debug('objCartDetail after calculate', objCalculatedCartDetail)
                let strSQL = ''
                if (objCartDetail.id) {
                    strSQL = 'select id from ' + mapper.netsuiteCartItem.id + " where custrecord_adap_atl_cart_item_order_id='" + objCartDetail.id + "'";
                } else if (objCartDetail.supportEntitlementNumber) {
                    let strSEN = (objCartDetail.id).replace('SEN-', '')
                    strSQL = 'select id from ' + mapper.netsuiteCartItem.id + " where custrecord_adap_atl_sen_number='" + strSEN + "'";
                } else {
                    let strItemId = refreshHelper.productIdParser(objCartDetail)
                    strSQL = 'select id from ' + mapper.netsuiteCartItem.id + " where custrecord_adap_atl_cart_parent='" + intCart + "'";
                    strSQL += " AND custrecord_adap_atl_quote_product_id='" + strItemId + "'"
                }
                log.debug('strSQL', strSQL)

                let arrCartItemId = query.runSuiteQL({
                    query: strSQL
                }).asMappedResults();
                log.debug('arrCartItemId', arrCartItemId)
                if (arrCartItemId.length > 0) {
                    intCartItemId = arrCartItemId[0].id
                }

                if (intCartItemId) {
                    let objCartItemRecord = record.load({
                        type: mapper.netsuiteCartItem.id,
                        id: intCartItemId,
                        isDynamic: true
                    })
                    refreshHelper.bodyFieldParser({
                        objRecord: objCartItemRecord,
                        maptype: 'atlassianCartItem',
                        data: objCalculatedCartDetail
                    });
                    let intCartItem = objCartItemRecord.save(); //Math.floor(Math.random() * (2000 - 1000 + 1) + 1000);
                    log.debug('Updated ITEM', intCartItem)

                    let intNSEstimateLineCount = objEstimate.getLineCount('item')
                    for (let itemIndex = 0; itemIndex < intNSEstimateLineCount; itemIndex++) {
                        let intEstimateCartItem = objEstimate.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_adap_atl_cart_item',
                            line: itemIndex
                        })
                        if (intEstimateCartItem == intCartItemId) {
                            let objEstimateLineMapper = mapper.estimate.sublist.item
                            let objCurrentLine = objEstimate.selectLine({sublistId: 'item', line: itemIndex})
                            for (let field in objEstimateLineMapper) {
                                let value = objCalculatedCartDetail[field]
                                if (value) {
                                    if (objEstimateLineMapper[field].type == 'date') {
                                        value = new Date(value)
                                    }
                                    if (objEstimateLineMapper[field].type == 'text') {
                                        objCurrentLine.setCurrentSublistText({
                                            sublistId: 'item',
                                            fieldId: objEstimateLineMapper[field].id,
                                            value: value
                                        })
                                    } else {
                                        objCurrentLine.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: objEstimateLineMapper[field].id,
                                            value: value
                                        })
                                    }
                                }

                            }
                            objCurrentLine.commitLine('item')
                        }
                    }
                }
            }
        }

        const addCartAndEstimate = (objEstimate, intCart, objCartDetail, objAtlQuote) => {
            if (objCartDetail) {
                log.debug('objCartDetail', objCartDetail)
                log.debug('objEstimate', objEstimate)
                log.debug('intCart', intCart)
                let objCalculatedCartDetail = refreshHelper.calculate(objCartDetail);
                log.debug('objCartDetail after calculate', objCalculatedCartDetail)
                let objCartItemRecord = record.create({
                    type: mapper.netsuiteCartItem.id,
                })
                //set Cartid
                objCalculatedCartDetail.cartId = intCart
                let arrNSItems = refreshHelper.getNSItems({atlQuote: {orderItems: [objCartDetail]}})
                log.debug('arrNSItems', arrNSItems)
                objCalculatedCartDetail.itemId = arrNSItems[0].id

                refreshHelper.bodyFieldParser({
                    objRecord: objCartItemRecord,
                    maptype: 'atlassianCartItem',
                    data: objCalculatedCartDetail
                });
                let intCartItem = objCartItemRecord.save();
                log.debug('intCartItem', intCartItem)

                //set objectCartItem
                objCalculatedCartDetail.cartitemid = intCartItem

                let objEstimateLineMapper = mapper.estimate.sublist.item
                let objCurrentLine = objEstimate.selectNewLine({sublistId: 'item'})
                for (let field in objEstimateLineMapper) {
                    let value = objCalculatedCartDetail[field]
                    if (!value) {
                        value = objEstimateLineMapper[field].default
                    }
                    if (value) {
                        if (objEstimateLineMapper[field].type == 'currency') {
                            value = parseFloat(value).toFixed(2)
                        }
                        log.debug(field, objEstimateLineMapper[field].id + ':' + value)

                        if (objEstimateLineMapper[field].type == 'date') {
                            value = new Date(value)
                        }
                        if (objEstimateLineMapper[field].type == 'text') {
                            objCurrentLine.setCurrentSublistText({
                                sublistId: 'item',
                                fieldId: objEstimateLineMapper[field].id,
                                value: value
                            })
                        } else {
                            objCurrentLine.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: objEstimateLineMapper[field].id,
                                value: value
                            })
                        }
                    }
                }
                // log.debug('objCurrentLine',objCurrentLine)
                objCurrentLine.commitLine('item')
            }
        }
        return {getInputData, map, reduce, summarize}

    })
