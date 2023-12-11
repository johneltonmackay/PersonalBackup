/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/query', 'N/runtime', 'N/search', 'N/https', './lib/adap_refresh.js',
    '../../Opportunity/UserEvent/lib/ada_ue_helper.js', '../../Opportunity/Library/adap_estimate_lib.js', '../../Atlassian/api/lib/cart.js',
    '../../Library/Items/netsuiteItem.js', '../../Library/TechnicalContact/adap_lib_tech_contact.js',
    '../../Library/SQL/adap_sql_library.js', '../../Library/FieldAndValueMapper/adap_field_and_def_value_mapper.js',
    '../../Library/calculations/calculations.js'],

    (record, query, runtime, search, https, refreshHelper,
        libMaintenancePeriodHelper, estimateLib, cartLib,
        itemLib, libTechContact,
        libSQL, libFieldAndDefaultValue,
        libCalculations) => {

        const QUOTED_STATUS = 3;
        const getInputData = (inputContext) => {
            var objScript = runtime.getCurrentScript()
            var intEstimateId = objScript.getParameter({ name: 'custscript_adap_atl_refresh_estimate_id' })
            var arrCartLines = libSQL.search({
                type: 'toRefreshQuote',
                params: {
                    estid: intEstimateId
                }
            });

            record.submitFields({
                type: record.Type.ESTIMATE,
                id: intEstimateId,
                values: {
                    custbody_adap_fail_reason: ''
                }
            })

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
                    productdescription: cartItem.productdescription,
                    sen: cartItem.sen
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
            var objScript = runtime.getCurrentScript()
            var intEstimateId = objScript.getParameter({ name: 'custscript_adap_atl_refresh_estimate_id' })
            const objMapValue = JSON.parse(mapContext.value);
            try {
                log.debug('objMapValue', objMapValue);
                var objAtJson = JSON.parse(objMapValue.atjson);
                var objNsJson = JSON.parse(objMapValue.nsjson);
                var arrProductIds = itemLib.getProductIds({ atlQuote: objAtJson });
                var arrNSItems = itemLib.getNSItemsBaseOnProductId(arrProductIds);
                arrNSItems = itemLib.createNSItemsIfNotExisting({ nsitems: arrNSItems, atlQuote: objAtJson })
                let arrToSendToReduce = [];
                // log.debug('arrNSItems',arrNSItems)
                let objEstimateRecord = record.load({
                    type: record.Type.ESTIMATE,
                    id: intEstimateId,
                    isDynamic: true
                })
                let objCart = search.lookupFields({
                    type: libFieldAndDefaultValue.atlassianCart.id,
                    id: objMapValue.cartid,
                    columns: ['name']
                })
                log.debug('objCart', objCart)
                let strATNumber = objCart.name;

                // let strURL = validationMapper.STR_ENVIRONMENT_ID + intEstimateId
                // strURL += '&mac=' + objEstimateRecord.getValue(libFieldAndDefaultValue.estimate.fields.macAccount.id)
                // log.debug('strURL', strURL);
                // let response = https.get({
                //     url: strURL
                // });
                let response = https.requestSuitelet({
                    scriptId: libFieldAndDefaultValue.suitelet.SCRIPT,
                    deploymentId: libFieldAndDefaultValue.suitelet.DEPLOYMENT,
                    external: true,
                    urlParams: {
                        action: 'getRefreshQuote',
                        estimate: intEstimateId,
                        mac: objEstimateRecord.getValue(libFieldAndDefaultValue.estimateFields.fields.macAccount.id)
                    }
                });
                log.audit('response', response);
                log.audit('response.body ', response.body);
                let arrResponseBody = JSON.parse(response.body)

                //get the object for the Cart // map stage process data per Cart
                const objQuote = arrResponseBody.find(item => item.name === strATNumber);
                for (let action in objQuote) {
                    //base on action complete the object details needed
                    if (action == 'toAdd' || action == 'NoChange' || action == 'toUpdate') {
                        log.debug('action', action)
                        let arrDataToAdd = objQuote[action]
                        for (let data of arrDataToAdd) {
                            if (data.supportEntitlementNumber) {
                                data.supportEntitlementNumber = (data.supportEntitlementNumber).replace('SEN-', '')
                            }
                            data.totalExTax = objAtJson.totalExTax;
                            data.totalIncTax = objAtJson.totalIncTax;
                            data.totalTax = objAtJson.totalTax;
                            data.productid = itemLib.parseProductId(data)
                            let objItemDetail = itemLib.getNSItemId(arrNSItems, data.productid)
                            data.itemId = objItemDetail.id
                            data.productid = objItemDetail.productId
                            data.action = 'add'
                            log.debug('data', data)
                            arrToSendToReduce.push(data)
                        }
                    }
                }
                log.debug('arrToSendToReduce', arrToSendToReduce)
                objMapValue.lines = arrToSendToReduce

                log.debug(' objMapValue.lines', objMapValue.lines)
                mapContext.write(objMapValue.cartid, objMapValue);

            } catch (e) {
                log.debug('MAP ERROR E:', e);
                setFailedMessage({ cartId: objMapValue.cartid, estid: intEstimateId, message: e.message })
                revertJSONData({ cartId: objMapValue.cartid, json: objMapValue.nsjson })
            }
        }


        const reduce = (reduceContext) => {
            log.debug('reduceContext', reduceContext.values);
            var objScript = runtime.getCurrentScript();
            var estid = objScript.getParameter({ name: libFieldAndDefaultValue.mr.params.estimate });
            var objCart = JSON.parse(reduceContext.values);
            log.debug(' objCart.nsjson', objCart.nsjson);
            try {
                var arrCartItems = []

                var objCartItem;

                var arrAtlItems = cartLib.plotQuotedCart({
                    items: objCart.lines
                })
                for (const item of arrAtlItems) {
                    item.type = libFieldAndDefaultValue.atlassianCartItem.id;
                    item.cartId = objCart.cartid;
                    if (item.action != 'delete' && item.action) {
                        log.debug('item', item)
                        objCartItem = refreshHelper.crudCartItem(item);
                        arrCartItems.push(objCartItem);
                    } else {
                        objCartItem = lines
                    }
                }
                var summary = refreshHelper.calculateSummary({ items: arrCartItems, cartid: objCart.cartid });
                log.debug('calculateSummary', summary);
                let objATLQuote = JSON.parse(objCart.atjson)
                summary.status = QUOTED_STATUS;

                summary.quoteDataJson = JSON.stringify(objATLQuote);
                summary.quoteRefreshDataJson = '';
                var intNewCartId = refreshHelper.updateCart({ summary, cartid: objCart.cartid });

                log.debug('intNewCartId', intNewCartId);
                // log.debug('fabricatedErrorAfterCartUpdate', fabricatedErrorAfterCartUpdate);

                reduceContext.write({
                    key: estid,
                    value: {
                        cartid: objCart.cartid,
                        items: JSON.stringify(arrCartItems),
                        nsjson: objCart.nsjson
                    }
                });
            } catch (e) {

                log.error('REDUCE ERROR E:', e);

                setFailedMessage({ cartId: objCart.cartid, estid: estid, message: e.message })
                revertJSONData({ cartId: objCart.cartid, json: objCart.nsjson })
            }
        }


        const summarize = (summaryContext) => {
            log.debug('summaryContext', summaryContext)
            var objScript = runtime.getCurrentScript();
            var estid = objScript.getParameter({ name: libFieldAndDefaultValue.mr.params.estimate });
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

                const cartItemMap = {};

                arrItems.forEach(item => {
                    const { cartId, cartitemid } = item;
                    if (!cartItemMap[cartId]) {
                        cartItemMap[cartId] = [];
                    }
                    cartItemMap[cartId].push(cartitemid);
                });

                log.debug('cartItemMap', cartItemMap)
                deleteOldLinesAndSetCustomerDiscount(estimate, cartItemMap)
                unlinkOldCartItemsInCart(cartItemMap)
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
                //update Maintenance Period and start/End Date
                libMaintenancePeriodHelper.updateMaintenancePeriod(estimate)
                //create non existing technical contact, and attach to estimate
                libTechContact.syncEstimateContactToJSON(estimate)


                //log.debug('fabricatedErrorAfterSummaryUpdate', fabricatedErrorAfterSummaryUpdate);

                record.submitFields({
                    type: 'estimate',
                    id: estid,
                    values: {
                        'custbody_adap_atl_refresh_status': 'DONE_REFRESH_QUOTE'
                    }
                })
                log.debug('SUMMARIZE END', summaryContext);
            } catch (e) {
                log.error('SUMARRY ERROR:', e)
                setFailedMessage({ cartId: '', estid: estid, message: e.message })

                summaryContext.output.iterator().each(function (key, value) {
                    log.debug('key on error', key);
                    log.debug('value on error', value);
                    var objResult = JSON.parse(value) || '{}';
                    log.debug('objResult', objResult);
                    var nsJson = objResult.nsjson;
                    var cartId = objResult.cartid
                    revertJSONData({ cartId: cartId, json: nsJson })
                    return true
                });

                record.submitFields({
                    type: 'estimate',
                    id: estid,
                    values: {
                        'custbody_adap_atl_refresh_status': 'FAILED_REFRESH_QUOTE',
                    }
                })

            }
        }
        const revertJSONData = (option) => {
            log.debug('revertJSONData option', option)
            record.submitFields({
                type: libFieldAndDefaultValue.atlassianCart.id,
                id: option.cartId,
                values: {
                    custrecord_adap_at_quote_data_json: option.json
                }
            })
        }
        const setFailedMessage = (option) => {
            try {
                let objRecord = record.load({
                    type: record.Type.ESTIMATE,
                    id: option.estid,
                    isDynamic: true
                })

                let strCurrentFailedMessage = objRecord.getValue('custbody_adap_fail_reason')
                if (option.cartId) {
                    let objCart = search.lookupFields({
                        type: libFieldAndDefaultValue.atlassianCart.id,
                        id: option.cartId,
                        columns: ['name']
                    })
                    log.debug('objCart', objCart)
                    let strATNumber = objCart.name;
                    option.message = strATNumber + ' : ' + option.message
                } else {
                    let strEstimateNumber = objRecord.getValue('tranid')
                    option.message = 'Estimate #' + strEstimateNumber + ' : ' + option.message
                }
                strCurrentFailedMessage += ' <br> ' + option.message
                objRecord.setValue({ fieldId: 'custbody_adap_fail_reason', value: strCurrentFailedMessage })
                objRecord.save()
            } catch (e) {
                log.error('error setFailedMessage', e.message)
            }

        }
        const unlinkOldCartItemsInCart = (objCartItemMap) => {
            for (let cart in objCartItemMap) {
                let arrCartItems = objCartItemMap[cart]
                log.audit('arrCartItems', arrCartItems)
                let strCartItemQuery = libSQL.sqlQuery.cartItemQueryForUnlinking
                strCartItemQuery = strCartItemQuery.replace('{cart}', cart)
                let arrCarts = query.runSuiteQL({
                    query: strCartItemQuery
                }).asMappedResults();
                log.audit('arrCarts', arrCarts)
                const itemsNotInEstimate = arrCarts.filter(item => !arrCartItems.includes(item.id)).map(item => item.id);
                log.audit('itemsNotInEstimate', itemsNotInEstimate)
                if (itemsNotInEstimate.length > 0) {
                    for (let cartItems of itemsNotInEstimate) {
                        record.submitFields({
                            type: libFieldAndDefaultValue.atlassianCartItem.id,
                            id: cartItems,
                            values: {
                                custrecord_adap_atl_cart_parent: ''
                            }
                        })
                    }
                }
            }

        }


        const deleteOldLinesAndSetCustomerDiscount = (intEstId, objAddedCartItems) => {
            let objEstimateRec = record.load({
                type: record.Type.ESTIMATE,
                id: intEstId,
                isDynamic: true
            })
            let intItemCount = objEstimateRec.getLineCount('item')
            let arrCustomerDiscount = []

            let objEstimateSublistFields = libFieldAndDefaultValue.estimateFields.sublist.item
            log.debug('intItemCount', intItemCount)
            for (let i = intItemCount - 1; i >= 0; i--) {
                log.debug('i', i)
                let intAtlCart = objEstimateRec.getSublistValue({
                    sublistId: libFieldAndDefaultValue.sublists.item,
                    fieldId: libFieldAndDefaultValue.estimateFields.sublist.item.cartId.id,
                    line: i
                })
                if (objAddedCartItems[intAtlCart]) {
                    let intCartItemId = objEstimateRec.getSublistValue({
                        sublistId: libFieldAndDefaultValue.sublists.item,
                        fieldId: objEstimateSublistFields.cartitemid.id,
                        line: i
                    })
                    let intSEN = objEstimateRec.getSublistValue({
                        sublistId: libFieldAndDefaultValue.sublists.item,
                        fieldId: objEstimateSublistFields.supportEntitlementNumber.id,
                        line: i
                    })
                    let arrAddedItemsInCart = objAddedCartItems[intAtlCart]
                    //   log.debug('intCartItemId', intCartItemId)
                    if (arrAddedItemsInCart.includes(parseInt(intCartItemId))) {
                        // log.debug('Newly Added Cart', intCartItemId)
                    } else {
                        let intItem = objEstimateRec.getSublistValue({
                            sublistId: libFieldAndDefaultValue.sublists.item,
                            fieldId: objEstimateSublistFields.itemId.id,
                            line: i
                        })
                        let intCustomerDiscount = objEstimateRec.getSublistValue({
                            sublistId: libFieldAndDefaultValue.sublists.item,
                            fieldId: objEstimateSublistFields.customerDiscountRate.id,
                            line: i
                        })
                        let intTier = objEstimateRec.getSublistValue({
                            sublistId: libFieldAndDefaultValue.sublists.item,
                            fieldId: objEstimateSublistFields.tierNumber.id,
                            line: i
                        })
                        let intMaintenanceMonth = objEstimateRec.getSublistValue({
                            sublistId: libFieldAndDefaultValue.sublists.item,
                            fieldId: objEstimateSublistFields.maintenanceMonths.id,
                            line: i
                        })
                        let strLineId = objEstimateRec.getSublistValue({
                            sublistId: libFieldAndDefaultValue.sublists.item,
                            fieldId: objEstimateSublistFields.id.id,
                            line: i
                        })
                        let strSen = objEstimateRec.getSublistValue({
                            sublistId: libFieldAndDefaultValue.sublists.item,
                            fieldId: objEstimateSublistFields.supportEntitlementNumber.id,
                            line: i
                        })
                        arrCustomerDiscount.push({
                            item: intItem,
                            tier: intTier,
                            discount: intCustomerDiscount,
                            cartid: intAtlCart,
                            lineId: strLineId,
                            sen: strSen,
                            maintenanceMonth: intMaintenanceMonth
                        })
                        objEstimateRec.removeLine({
                            sublistId: libFieldAndDefaultValue.sublists.item,
                            line: i
                        })
                    }
                }
            }
            log.debug('arrCustomerDiscount', arrCustomerDiscount)

            //log.debug('objEstimateRec.getLineCount(item) after remove', objEstimateRec.getLineCount('item'))

            //set customer discount to new lines
            let intNewLineCount = objEstimateRec.getLineCount('item')

            for (let itemIndex = 0; itemIndex < intNewLineCount; itemIndex++) {
                let intAtlCart = objEstimateRec.getSublistValue({
                    sublistId: libFieldAndDefaultValue.sublists.item,
                    fieldId: objEstimateSublistFields.cartId.id,
                    line: itemIndex
                })
                let intItem = objEstimateRec.getSublistValue({
                    sublistId: libFieldAndDefaultValue.sublists.item,
                    fieldId: objEstimateSublistFields.itemId.id,
                    line: itemIndex
                })
                let strSen = objEstimateRec.getSublistValue({
                    sublistId: libFieldAndDefaultValue.sublists.item,
                    fieldId: objEstimateSublistFields.supportEntitlementNumber.id,
                    line: itemIndex
                })
                let intTier = objEstimateRec.getSublistValue({
                    sublistId: libFieldAndDefaultValue.sublists.item,
                    fieldId: objEstimateSublistFields.tierNumber.id,
                    line: itemIndex
                })
                let intMaintenanceMonth = objEstimateRec.getSublistValue({
                    sublistId: libFieldAndDefaultValue.sublists.item,
                    fieldId: objEstimateSublistFields.maintenanceMonths.id,
                    line: itemIndex
                })
                // log.debug('strLineId',strLineId)
                arrCustomerDiscount = Array.from(arrCustomerDiscount).reverse();
                for (const [index, item] of arrCustomerDiscount.entries()) {
                    if (item.item === intItem && item.cartid === intAtlCart && item.sen === strSen &&
                        item.tier === intTier && item.maintenanceMonth === intMaintenanceMonth) {
                        // Remove the matched object from the original array


                        let currentLine = objEstimateRec.selectLine({
                            sublistId: libFieldAndDefaultValue.sublists.item,
                            line: itemIndex,
                        });
                        var objGetSubListValue = {
                            sublistId: libFieldAndDefaultValue.sublists.item,
                        }
                        objGetSubListValue.fieldId = objEstimateSublistFields.listPrice.id
                        var fltListPrice = currentLine.getCurrentSublistValue(objGetSubListValue)

                        objGetSubListValue.fieldId = objEstimateSublistFields.upgradeCredit.id
                        var fltUpgradeCredit = currentLine.getCurrentSublistValue(objGetSubListValue)

                        objGetSubListValue.fieldId = objEstimateSublistFields.priceAdjustment.id
                        var fltPriceAdjustment = currentLine.getCurrentSublistValue(objGetSubListValue)

                        objGetSubListValue.fieldId = objEstimateSublistFields.avstDiscountAmount.id
                        var fltAvstDiscount = currentLine.getCurrentSublistValue(objGetSubListValue)

                        var objItem = {
                            listPrice: fltListPrice,
                            upgradeCredit: fltUpgradeCredit,
                            priceAdjustment: fltPriceAdjustment,
                            avstDiscountAmount: fltAvstDiscount,
                            customerDiscountRate: item.discount,
                        };

                        objItem = libCalculations.atlassianCartItemCalculation({ item: objItem })

                        for (const objItemKey in objItem) {
                            currentLine.setCurrentSublistValue({
                                sublistId: libFieldAndDefaultValue.sublists.item,
                                fieldId: objEstimateSublistFields[objItemKey].id,
                                value: objItem[objItemKey]
                            })
                        }

                        currentLine.setCurrentSublistValue({
                            sublistId: libFieldAndDefaultValue.sublists.item,
                            fieldId: objEstimateSublistFields.customerDiscountRate.id,
                            value: item.discount
                        })

                        currentLine.commitLine('item')

                        arrCustomerDiscount.splice(index, 1);
                        break;
                    }
                }
            }

            libCalculations.estimateSummaryCalculation(objEstimateRec)

            objEstimateRec.save()
        }

        return { getInputData, map, reduce, summarize }

    })
