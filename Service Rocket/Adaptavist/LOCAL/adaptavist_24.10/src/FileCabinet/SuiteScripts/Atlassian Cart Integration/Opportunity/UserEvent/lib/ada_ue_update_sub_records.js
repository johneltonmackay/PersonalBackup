/**
 * @NApiVersion 2.1
 */
define(['../../../Atlassian/api/lib/cart.js', '../../../Library/calculations/calculations.js', '../../../Library/FieldAndValueMapper/adap_field_and_def_value_mapper.js'],

    (libCart, libCalculation, libMapper) => {

        const SUBLISTID = 'item';
        const METHOD_UPDATE = 'update';

        PUBLIC = {}
        PUBLIC.updateATLItemRecords = (options) => {
            var scriptContext = options.scriptContext;
            const CURRENCY_SYMBOL_FIELD = 'currencysymbol';
            const TRANSACTION_DATE = 'trandate'

            const objOldRecord = scriptContext.oldRecord;
            const objNewRecord = scriptContext.newRecord;

            const arrUpdatedCarts = {}
            var intOldRecordLineCount = objOldRecord.getLineCount('item');
            var objSublistFields = libMapper.estimateFields.sublist.item;


            var strCurrencySymbol = objNewRecord.getValue(CURRENCY_SYMBOL_FIELD);
            var strTrandate = objNewRecord.getValue(TRANSACTION_DATE);
            var fltCurrencyBuffer = objNewRecord.getValue(libMapper.estimateFields.fields.currencyBuffer.id)

            var intUSDCurrencyRate = libCalculation.currencyExchange({
                from: strCurrencySymbol,
                date: strTrandate || new Date()
            });

            for (let intLineCounter = 0; intLineCounter < intOldRecordLineCount; intLineCounter++) {
                var isChanged = false;
                var oldCartItemId = objOldRecord.getSublistValue({
                    sublistId: SUBLISTID,
                    fieldId: libMapper.estimateFields.sublist.item.cartitemid.id,
                    line: intLineCounter
                });
                var intNewRecordLineId = objNewRecord.findSublistLineWithValue({
                    sublistId: SUBLISTID,
                    fieldId: libMapper.estimateFields.sublist.item.cartitemid.id,
                    value: oldCartItemId
                });

                if (intNewRecordLineId >= 0) {
                    objNewItemValues = {};
                    for (const sublistFieldKey in objSublistFields) {
                        var oldValue = objOldRecord.getSublistValue({
                            sublistId: SUBLISTID,
                            fieldId: objSublistFields[sublistFieldKey].id,
                            line: intLineCounter
                        });
                        var newValue = objNewRecord.getSublistValue({
                            sublistId: SUBLISTID,
                            fieldId: objSublistFields[sublistFieldKey].id,
                            line: intNewRecordLineId
                        });

                        if (typeof newValue != 'NaN' || typeof newValue != 'undefined') {
                            continue
                        }

                        if (newValue != '') {
                            if (objSublistFields[sublistFieldKey].type == 'currency' && objSublistFields[sublistFieldKey].ignoreConversion != true) {
                                newValue = libCalculation.convertAmountToUSD({
                                    usdCurrencyRate: intUSDCurrencyRate,
                                    currencyBuffer: fltCurrencyBuffer,
                                    currencySymbol: strCurrencySymbol,
                                    amount: newValue
                                });
                            }
                            objNewItemValues[sublistFieldKey] = newValue;
                        }

                        if (newValue != oldValue) {
                            isChanged = true;
                        }
                    }

                    if (isChanged) {
                        var newCartItemId = objNewRecord.getSublistValue({
                            sublistId: SUBLISTID,
                            fieldId: objSublistFields.cartitemid.id,
                            line: intNewRecordLineId
                        });
                        objNewItemValues.cartitemid = newCartItemId;
                        log.debug('objNewItemValues', objNewItemValues)
                        if (newCartItemId) {
                            libCart.configureRecord({
                                type: 'atlassianCartItem',
                                id: newCartItemId,
                                data: objNewItemValues,
                                method: METHOD_UPDATE
                            });
                        }
                        if (typeof arrUpdatedCarts[objNewItemValues.cartId] == 'undefined') {
                            arrUpdatedCarts[objNewItemValues.cartId] = { items: [] }
                        }
                        arrUpdatedCarts[objNewItemValues.cartId].items.push(objNewItemValues)
                    }
                }
            }
            // try {
            //     for (const cartId in arrUpdatedCarts) {
            //         var objCart = arrUpdatedCarts[cartId];

            //     }
            // } catch (e) {
            //     log.debug('updatingCart', e)
            // }
            log.debug('arrUpdatedCarts ', arrUpdatedCarts)
        }

        return PUBLIC

    });
