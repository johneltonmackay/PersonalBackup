/**
 * @NApiVersion 2.x
 * @NScriptType plugintypeimpl
 */
define(['../../Library/FieldAndValueMapper/adap_field_and_def_value_mapper.js', '../../Library/SQL/adap_sql_library.js', '../../Library/integrator/integrator.js', '../../Library/calculations/calculations.js',
    '../../Library/calculations/adap_cs_calculations.js'],

    function (libMapper, libSuitesQl, integrator, libCalculations,
        libCalculationsCS) {

        const CURRENCY_SYMBOL_FIELD = 'currencysymbol';
        const CURRENCY_SUBLIST_FIELD_TYPE = 'currency';
        const TRANSACTION_DATE = 'trandate';
        const LOCALSTORAGE_RECALCULATECONVERTION = 'recalculateConvertion'
        const objBodyfields = libMapper.estimateFields.fields;
        const objSublistFields = libMapper.estimateFields.sublist.item;
        const CURRENCY_USD = libMapper.currency.usd.text;
        const ignoreFieldKeys = ['customerDiscountRate', 'avstTotal', 'margin', 'newListPrice_amount', 'newListPrice_rate'];
        var strPreviousCurrencySymbol = CURRENCY_USD;
        const getAtlQuoteWithID = (options) => {
            try {
                const intAtlQuoteId = options.quoteId
                const intAtlUuid = options.uuid
                const intMac = options.mac

                var objAtlQuote = integrator.integrate({
                    method: 'get',
                    mac: intMac,
                    path: libMapper.integrator.PATH_GET_QUOTE,
                    urlParam: intAtlQuoteId,
                    integration: 'adap_hamlet'
                })

                var objAtlDraft = integrator.integrate({
                    method: 'get',
                    mac: intMac,
                    path: libMapper.integrator.PATH_CART_GET,
                    urlParam: intAtlUuid,
                    integration: 'adap_hamlet'
                });
                // for (const [indxItem, item] of objAtlDraft.items.entries()) {
                //     var objTemp = objAtlQuote.orderItems[indxItem]
                //     objAtlQuote.orderItems[indxItem] = {...objTemp, ...item}
                // }
                let arrAtlItems = objAtlQuote.orderItems
                let arrDraftItem = objAtlDraft.items
                const combinedArray = arrDraftItem.map((item, index) => {
                    const combinedObject = {
                        ...arrAtlItems[index],
                        id: String(item.id),
                    };
                    return combinedObject;
                });
                objAtlQuote.orderItems = combinedArray
                return objAtlQuote
            } catch (e) {
                log.error('error getAtlQuoteWithID', e.message)
                return false
            }
        }

        const setTermsAndConditions = (objRecord) => {
            try {
                arrTcOptions = objRecord.getValue('custbody_adap_tc_option') || '';
                log.debug('arrTcOptions', arrTcOptions);

                if (arrTcOptions) {
                    var arrTcResult = libSuitesQl.search({
                        type: 'getTcContents',
                        params: {
                            tcoptions: arrTcOptions,
                        }
                    });

                    var strTcContent
                    for (let tc of arrTcResult) {
                        if (strTcContent) {
                            strTcContent += '\n \n' + tc.tcoption;
                        } else {
                            strTcContent = tc.tcoption;
                        }
                    }
                    objRecord.setValue(libMapper.estimateFields.fields.tcContent.id, strTcContent);
                }
            } catch (e) {

            }
        }

        const disableSublistFields = (objCurRecord) => {


            var sublistName = objCurRecord.getSublist({ sublistId: "item" });
            var rateCol = sublistName.getColumn({ fieldId: objSublistFields.newListPrice_rate.id });
            var amountCol = sublistName.getColumn({ fieldId: objSublistFields.newListPrice_amount.id });
            // var customerDiscountRateCol = sublistName.getColumn({ fieldId: objSublistFields.customerDiscountRate.id });
            rateCol.isDisabled = true;
            amountCol.isDisabled = true;
            // customerDiscountRateCol.isDisabled = true;
        }

        const sublistFieldChange = (scriptContext) => {
            try {
                var curRecord = scriptContext.currentRecord;
                var objUnfixedValues = {};
                var isChanged = false;
                switch (scriptContext.fieldId) {
                    case objSublistFields.listPrice.id: // initial List Price
                    case objSublistFields.upgradeCredit.id: // upgrade Credit
                    case objSublistFields.avstDiscountAmount.id:
                    case objSublistFields.priceAdjustment.id:
                    case objSublistFields.creditAmount.id:
                        for (const fieldKey in objSublistFields) {
                            var field = objSublistFields[fieldKey];
                            if (field.type == CURRENCY_SUBLIST_FIELD_TYPE) {
                                var value = curRecord.getCurrentSublistValue({ sublistId: scriptContext.sublistId, fieldId: field.id }) || 0
                                objUnfixedValues[fieldKey] = libCalculations.toFixNumber(value);
                            }
                        }
                        var objSetCurrentSublistValue = {
                            sublistId: libMapper.sublists.item,
                            ignoreFieldChange: true,
                            ignoreRecalc: true,
                        }

                        curRecord.setCurrentSublistValue({ ...objSetCurrentSublistValue, fieldId: objSublistFields.listPrice.id, value: objUnfixedValues.listPrice, });

                        // upgrade Credit
                        var fltUpgradeCredit = libCalculations.toFixNumber(objUnfixedValues.upgradeCredit);
                        curRecord.setCurrentSublistValue({ ...objSetCurrentSublistValue, fieldId: objSublistFields.upgradeCredit.id, value: objUnfixedValues.upgradeCredit });

                        curRecord.setCurrentSublistValue({ ...objSetCurrentSublistValue, fieldId: objSublistFields.creditAmount.id, value: objUnfixedValues.upgradeCredit });

                        var fltUpgradeCredit = objUnfixedValues.upgradeCredit;
                        var fltPriceAdjustment = objUnfixedValues.priceAdjustment;

                        objUnfixedValues.newListPrice = objUnfixedValues.listPrice - fltUpgradeCredit - fltPriceAdjustment
                        var fltNewListPrice = libCalculations.toFixNumber(objUnfixedValues.newListPrice);

                        if (objUnfixedValues.listPrice != null && fltUpgradeCredit != null) {
                            fltNewListPrice = fltNewListPrice >= 0 ? fltNewListPrice : 0;
                            var arrSetValues = ['custcol_adap_atl_item_newlistprice', 'rate', 'amount'];
                            for (const field of arrSetValues) {
                                curRecord.setCurrentSublistValue({
                                    ...objSetCurrentSublistValue,
                                    fieldId: field,
                                    value: fltNewListPrice,
                                    ignoreFieldChange: field == 'amount' ? false : true
                                });
                            }
                        }
                        objUnfixedValues.avstTotal = objUnfixedValues.listPrice - objUnfixedValues.upgradeCredit - objUnfixedValues.priceAdjustment - objUnfixedValues.avstDiscountAmount;
                        objUnfixedValues.avstTotal = objUnfixedValues.avstTotal >= 0 ? objUnfixedValues.avstTotal : 0;
                        var fltAvstTotal = libCalculations.toFixNumber(objUnfixedValues.avstTotal);

                        curRecord.setCurrentSublistValue({ ...objSetCurrentSublistValue, fieldId: objSublistFields.avstTotal.id, value: fltAvstTotal, });

                        objUnfixedValues = setCustomerDiscount({ isAmount: true, objUnfixedValues });
                        isChanged = true
                        console.log('sublistFieldChange | objUnfixedValues', objUnfixedValues)
                        break;

                    case objSublistFields.customerDiscountRate.id:
                        objUnfixedValues = setCustomerDiscount({ isPercent: true, objUnfixedValues });
                        isChanged = true
                        break;
                    case objSublistFields.customerDiscountAmount.id:
                        objUnfixedValues = setCustomerDiscount({ isAmount: true, objUnfixedValues });
                        isChanged = true
                        break;

                }

                if (isChanged) {
                    curRecord.setCurrentSublistValue({
                        sublistId: libMapper.sublists.item,
                        fieldId: objSublistFields.unfixedValues.id,
                        value: JSON.stringify(objUnfixedValues),
                        ignoreFieldChange: true,
                        ignoreRecalc: true,
                    });
                }
            } catch (e) {
                console.log('Field Change | Error', { title: 'Field Change ', message: e });
            }
        }

        const setCustomerDiscount = (options) => {
            var objSetCurrentSublistValue = {
                sublistId: libMapper.sublists.item,
                ignoreFieldChange: true,
                ignoreRecalc: true,
            }
            console.log('objSetCurrentSublistValue', objSetCurrentSublistValue)
            try {
                var blnHasUnfixedValues = !!Object.keys(options.objUnfixedValues).length;
                var objUnfixedValues = blnHasUnfixedValues ? options.objUnfixedValues : getUnfixedValues({ curRecord });
                console.log('setCustomerDiscount | objUnfixedValues', objUnfixedValues)
                if (options.isPercent) {
                    objUnfixedValues.customerDiscountRate = curRecord.getCurrentSublistValue({
                        ...objSetCurrentSublistValue,
                        fieldId: objSublistFields.customerDiscountRate.id,
                    });
                    objUnfixedValues.customerDiscountAmount = objUnfixedValues.newListPrice * (objUnfixedValues.customerDiscountRate / 100);
                } else if (options.isAmount) {
                    objUnfixedValues.customerDiscountAmount = curRecord.getCurrentSublistValue({
                        ...objSetCurrentSublistValue,
                        fieldId: objSublistFields.customerDiscountAmount.id,
                    });
                    objUnfixedValues.customerDiscountRate = (objUnfixedValues.customerDiscountAmount / objUnfixedValues.newListPrice) * 100;
                }
                objUnfixedValues.customerPrice = objUnfixedValues.newListPrice - objUnfixedValues.customerDiscountAmount;
                objUnfixedValues.avstTotal = objUnfixedValues.newListPrice - objUnfixedValues.avstDiscountAmount || 0;
                objUnfixedValues.margin = objUnfixedValues.customerPrice - objUnfixedValues.avstTotal;
                objUnfixedValues.totalDiscount = objUnfixedValues.avstDiscountAmount || 0 + objUnfixedValues.customerDiscountAmount;

                objUnfixedValues.customerPrice = objUnfixedValues.customerPrice >= 0 ? objUnfixedValues.customerPrice : 0;
                objUnfixedValues.customerDiscountRate = objUnfixedValues.newListPrice >= 0 ? objUnfixedValues.customerDiscountRate : 0;
                objUnfixedValues.customerDiscountAmount = objUnfixedValues.newListPrice >= 0 ? objUnfixedValues.customerDiscountAmount : 0;

                var arrSetOnlyTheseFields = ['customerPrice', 'margin', 'totalDiscount', 'customerDiscountAmount', 'customerDiscountRate'];
                for (const objSublistField of arrSetOnlyTheseFields) {
                    console.log('setCustomerDiscount | objSublistField', objUnfixedValues[objSublistField])
                    curRecord.setCurrentSublistValue({
                        ...objSetCurrentSublistValue,
                        fieldId: objSublistFields[objSublistField].id,
                        value: libCalculations.toFixNumber(objUnfixedValues[objSublistField] || 0),
                    });
                }

                console.log('setCustomerDiscount | objUnfixedValues.customerDiscountRate 1 ', objUnfixedValues.customerDiscountRate)
                if (options.isPercent) {
                    curRecord.setCurrentSublistValue({
                        ...objSetCurrentSublistValue,
                        fieldId: objSublistFields.customerDiscountAmount.id,
                        value: libCalculations.toFixNumber(objUnfixedValues.customerDiscountAmount || 0)
                    });
                } else if (options.isAmount) {
                    curRecord.setCurrentSublistValue({
                        ...objSetCurrentSublistValue,
                        fieldId: objSublistFields.customerDiscountRate.id,
                        value: libCalculations.toFixNumber(objUnfixedValues.customerDiscountRate || 0)
                    });
                }
                console.log('setCustomerDiscount | objUnfixedValues.customerDiscountRate 2 ', objUnfixedValues)
                return objUnfixedValues
            } catch (e) {
                console.log('setCustomerDiscount | Error', e)
            }
        }

        const bodyFieldChange = (scriptContext) => {
            var curRecord = scriptContext.currentRecord
            var objEstimateFields = libMapper.estimateFields.fields
            switch (scriptContext.fieldId) {
                case objEstimateFields.customerId.id:
                    curRecord.setValue({
                        fieldId: objEstimateFields.discountitem.id,
                        value: objEstimateFields.discountitem.default
                    })
                    break;
                case objEstimateFields.currencyId.id:

                    libCalculations.setCurrencyRateBuffer({ record: curRecord, fieldId: scriptContext.fieldId });
                    var objCurrencyField = curRecord.getField({ fieldId: objEstimateFields.currencyId.id });

                    objCurrencyField.isDisabled = true
                    localStorage.setItem(LOCALSTORAGE_RECALCULATECONVERTION, true);
                    setTimeout(() => {
                        setCurrencyRate(curRecord, true);
                        setTimeout(() => {
                            libCalculationsCS.reCalculateInsertedItems({
                                record: curRecord
                            });
                            localStorage.setItem(LOCALSTORAGE_RECALCULATECONVERTION, false);
                            objCurrencyField.isDisabled = false;
                        }, 200);
                    }, 1000);
                    break;
            }

            return true
        }

        function setCurrencyRate(curRecord, blnCurrencyFieldChanged) {
            var strSelectedCurrencySymbol = curRecord.getValue(CURRENCY_SYMBOL_FIELD);
            var objTransactionDate = curRecord.getValue(TRANSACTION_DATE);
            var arrRates = [{
                to: strSelectedCurrencySymbol,
                from: strSelectedCurrencySymbol == CURRENCY_USD ? strPreviousCurrencySymbol : CURRENCY_USD,
                fieldId: objBodyfields.toUsdConversion.id
            }, {
                to: strSelectedCurrencySymbol == CURRENCY_USD ? strPreviousCurrencySymbol : CURRENCY_USD,
                from: strSelectedCurrencySymbol,
                fieldId: objBodyfields.usdConversion.id
            }];

            if (blnCurrencyFieldChanged) {
                console.log('switched')
                arrRates[0].fieldId = objBodyfields.toUsdConversion.id;
                arrRates[1].fieldId = objBodyfields.usdConversion.id;
            }

            for (const rate of arrRates) {
                var intRate = libCalculations.currencyExchange({
                    ...rate,
                    date: objTransactionDate
                });
                curRecord.setValue({
                    ...rate,
                    value: intRate,
                    ignoreFieldChange: true
                })
            }
            strPreviousCurrencySymbol = strSelectedCurrencySymbol
        }

        const getCurrencyExchangeRateForNewRecord = (curRecord) => {
            var strCurrencySymbol = curRecord.getValue(CURRENCY_SYMBOL_FIELD)
            CONVERSION_RATE = libCalculations.currencyExchange({ to: strCurrencySymbol, date: new Date() })
        }

        const setItemDescription = (scriptContext) => {
            var curRecord = scriptContext.currentRecord;
            switch (scriptContext.fieldId) {
                case objSublistFields.itemId.id:
                case objSublistFields.tierNumber.id:
                    var intItemId = curRecord.getCurrentSublistValue({ sublistId: scriptContext.sublistId, fieldId: objSublistFields.itemId.id });
                    var intUnitTier = curRecord.getCurrentSublistValue({ sublistId: scriptContext.sublistId, fieldId: objSublistFields.tierNumber.id });
                    var objItem = libSuitesQl.search({ type: 'nsItems', params: { productIds: ' id = ' + intItemId, } })[0];

                    console.log('objItem.addonkey,', objItem.addonkey)
                    if (intItemId) {
                        $.ajax({
                            url: `${libMapper.scriptLink}&action=searchProduct&search=${objItem.addonkey}`,
                            method: 'GET',
                            success: function (data) {
                                data = JSON.parse(data)
                                console.log('setItemDescription,', data)
                                objSetDescription = {
                                    sublistId: scriptContext.sublistId,
                                    fieldId: 'description',
                                    text: data.productDescription
                                }
                                if (intUnitTier) {
                                    var intOrderableItem = data.orderableItems.findIndex((obj) => obj.unitCount == intUnitTier)
                                    objSetDescription.text = intOrderableItem >= 0 ? data.orderableItems[intOrderableItem].description : data.productDescription
                                }
                                if (objSetDescription.text) {
                                    curRecord.setCurrentSublistText(objSetDescription)
                                }
                            }
                        })
                    }
                    break;
            }
        }

        const validateLine = (options) => {
            console.log('validateLine', options);
            const { curRecord, scriptContext, objOldLineValues } = options
            const blnRecalculateConvertion = localStorage.getItem(LOCALSTORAGE_RECALCULATECONVERTION) == 'true' ? true : false;

            var blnReturnValue = false;
            var strDescription = curRecord.getCurrentSublistValue({ sublistId: scriptContext.sublistId, fieldId: 'description' });

            if (strDescription.length && !blnRecalculateConvertion) {
                setSublistValidatedLine({ scriptContext, objOldLineValues });
                libCalculations.estimateSummaryCalculation(curRecord);
                blnReturnValue = true
            } else if (!strDescription.length) {
                alert('Please enter a value for Description');
            } else if (blnRecalculateConvertion) {
                blnReturnValue = true
            }

            var intCurrencyId = curRecord.getValue({
                fieldId: objBodyfields.currencyId.id
            });
            curRecord.setCurrentSublistValue({
                sublistId: scriptContext.sublistId,
                fieldId: objSublistFields.currency.id,
                value: intCurrencyId,
                ignoreFieldChange: true,
                ignoreRecalc: true,
            });
            return blnReturnValue
        }

        const getUnfixedValues = (options) => {
            const { curRecord } = options;
            var strUnfixedValues = curRecord.getCurrentSublistValue({ sublistId: libMapper.sublists.item, fieldId: objSublistFields.unfixedValues.id });
            var objUnfixedValues = {};
            if (strUnfixedValues) {
                objUnfixedValues = JSON.parse(strUnfixedValues)
            } else {
                for (const fieldKey in objSublistFields) {
                    var field = objSublistFields[fieldKey];
                    if (field.type == CURRENCY_SUBLIST_FIELD_TYPE && !ignoreFieldKeys.includes(fieldKey)) {
                        var fltValue = curRecord.getCurrentSublistValue({
                            sublistId: libMapper.sublists.item,
                            fieldId: field.id,
                        });
                        objUnfixedValues[fieldKey] = fltValue;

                    }
                }
            }
            return objUnfixedValues
        }

        const setSublistValidatedLine = (options) => {
            const { scriptContext } = options
            var objOldLineValues = {}
            var strCurrencySymbol = curRecord.getValue(CURRENCY_SYMBOL_FIELD);
            var strCurrencyValue = curRecord.getValue(objBodyfields.currencyId.id);
            var intUSDCurrencyRate = curRecord.getValue(objBodyfields.toUsdConversion.id);
            var intCurrencyBuffer = curRecord.getValue(objBodyfields.currencyBuffer.id);
            var strSublistCurrencyValue = curRecord.getCurrentSublistValue({ sublistId: scriptContext.sublistId, fieldId: objSublistFields.currency.id });
            var intCurrency = curRecord.getCurrentSublistValue({ sublistId: scriptContext.sublistId, fieldId: objSublistFields.currency.id });
            var strCurrencySymbol = curRecord.getValue({ sublistId: scriptContext.sublistId, fieldId: CURRENCY_SYMBOL_FIELD });

            var objUnfixedValues = getUnfixedValues({ curRecord });
            var objSetCurrentSublistValue = {
                sublistId: scriptContext.sublistId,
                ignoreFieldChange: true,
                ignoreRecalc: true,
            }
            for (const fieldKey in objSublistFields) {
                var field = objSublistFields[fieldKey];
                var intNewValue = objUnfixedValues[fieldKey];
                if (field.type == CURRENCY_SUBLIST_FIELD_TYPE && !ignoreFieldKeys.includes(fieldKey)) {
                    if (objOldLineValues[fieldKey] != intNewValue && strSublistCurrencyValue != strCurrencyValue) {
                        var intValue = libCalculations.applyCurrencyExchange({ value: intNewValue, rate: intUSDCurrencyRate });
                        if (field.hasBuffer && strCurrencySymbol != CURRENCY_USD) {
                            intValue = libCalculations.applyCurrencyBuffer({ value: intValue, currencyBuffer: intCurrencyBuffer });
                        }
                        curRecord.setCurrentSublistValue({ sublistId: scriptContext.sublistId, fieldId: field.id, value: libCalculations.toFixNumber(intValue) });
                        objUnfixedValues[fieldKey] = intValue;
                    }
                }
            }
            var intUSDCurrencyId = libMapper.currency.usd.id;
            // if (strCurrencySymbol != CURRENCY_USD && intCurrency != intUSDCurrencyId && strSublistCurrencyValue != strCurrencyValue) {
            objUnfixedValues.avstTotal = objUnfixedValues.newListPrice - objUnfixedValues.avstDiscountAmount;
            objUnfixedValues.customerPrice = objUnfixedValues.newListPrice - objUnfixedValues.customerDiscountAmount
            objUnfixedValues.margin = objUnfixedValues.customerPrice - objUnfixedValues.avstTotal;
            for (const fieldKey in objUnfixedValues) {

                curRecord.setCurrentSublistValue({
                    ...objSetCurrentSublistValue,
                    fieldId: objSublistFields[fieldKey].id,
                    value: libCalculations.toFixNumber(objUnfixedValues[fieldKey] || 0),
                });

            }

            var objNewlistPrice = {
                ...objSetCurrentSublistValue,
                fieldId: objSublistFields.newListPrice_rate.id,
                value: libCalculations.toFixNumber(objUnfixedValues.newListPrice),
            };
            curRecord.setCurrentSublistValue(objNewlistPrice);

            objNewlistPrice.fieldId = objSublistFields.newListPrice_amount.id;
            curRecord.setCurrentSublistValue(objNewlistPrice);

            // }
            curRecord.setCurrentSublistValue({
                ...objSetCurrentSublistValue,
                fieldId: objSublistFields.customerDiscountAmount.id,
                value: libCalculations.toFixNumber(objUnfixedValues.customerDiscountAmount),
                ignoreFieldChange: false
            });

            curRecord.setCurrentSublistValue({
                sublistId: scriptContext.sublistId,
                fieldId: objSublistFields.unfixedValues.id,
                value: JSON.stringify(objUnfixedValues),
                ignoreFieldChange: true,
                ignoreRecalc: true,
            });

            return
        }

        return {
            setCurrencyRate,
            setTermsAndConditions,
            disableSublistFields,
            sublistFieldChange,
            bodyFieldChange,
            getAtlQuoteWithID,
            getCurrencyExchangeRateForNewRecord,
            setItemDescription,
            validateLine,
        };

    });
