/**
 * @NApiVersion 2.1
 */
define(['N/record', '../../../Library/htmllib/moment/momentjs.js',
    '../../../Library/calculations/calculations.js', '../../../Library/Items/netsuiteItem.js',
    '../../../Library/FieldAndValueMapper/adap_field_and_def_value_mapper.js',
    '../../../Atlassian/api/lib/cart.js'],

    (record, moment,
        libCalculation, itemLib,
        libFieldAndDefaultValue,
        libCart
    ) => {
        const SUBLISTID = 'item';
        const METHOD_CREATE = 'create';
        const METHOD_ADDITEMS = 'additems';
        const METHOD_UPDATE = 'update';

        // CARTS
        const calculateSummary = (options) => {
            log.debug('calculateSummary', options);
            var arrOldItems = options.items;
            var arrNewItems = [];
            for (const line of arrOldItems) {
                if (line.action == 'delete') {
                    continue;
                }
                arrNewItems.push(line);
            }
            var objCartSummary = libCalculation.atlassianCartSummaryCalculation({
                items: arrNewItems
            });
            log.debug('objCartSummary', objCartSummary)
            return objCartSummary;
        }

        const updateCart = (options) => {
            if (options.cartid) {
                var intNewCartId = libCart.configureRecord({
                    type: 'atlassianCart',
                    id: options.cartid,
                    data: options.summary,
                    option: {},
                    method: METHOD_UPDATE
                });
                log.debug('intNewCartId', intNewCartId);

                record.submitFields({
                    type:libFieldAndDefaultValue.atlassianCart.id,
                    id:intNewCartId,
                    values:{
                        custrecord_adap_at_cart_updated_date:new Date()
                    }
                })

                return intNewCartId
            }
        }


        // CART ITEMS
        const crudCartItem = (option) => {
            log.debug('crudCartItem', option);
            var objCartItemRecord;
            var cartitemid;
            var objReturn = {}
            if (option.action == 'add') {
                cartitemid = libCart.configureRecord({
                    type: 'atlassianCartItem',
                    data: option,
                    option: option,
                    method: METHOD_CREATE
                });
            } else if (option.action == 'update' && option.cartitemid) {
                cartitemid = libCart.configureRecord({
                    type: 'atlassianCartItem',
                    id: option.cartitemid,
                    data: option,
                    option: option,
                    method: METHOD_UPDATE
                });
            } else if (option.action == 'delete') {
                objCartItemRecord = record.delete({ type: libFieldAndDefaultValue.atlassianCartItem.id, id: option.cartitemid });
                return;
            }
            objReturn = {
                ...option,
                cartitemid: cartitemid,
                action: option.action
            }
            log.debug('objReturn', objReturn)
            return objReturn
        }

        const getDataToBeDeleted = (options) => {
            var rawData = []
            for (const strCart of options) {
                var objCart = JSON.parse(strCart || '{}');
                rawData.push({
                    cartid: objCart.cartid,
                    cartitemid: objCart.cartitemid,
                    productitemid: objCart.productitemid,
                    itemdiscountpercent: objCart.itemdiscountpercent,
                })
            }
            return rawData
        }

        // GENERAL USE

        const updateEstimateRecord = (option) => {
            var arrEstimateLines = [];
            var arrEstRemoveLines = [];
            for (const item of option.items) {
                arrEstimateLines.push(item);
            }
            for (const item of option.items) {
                if (item.action == 'delete') {
                    arrEstRemoveLines.push(item);
                }
            }
            var estimateId = libCart.configureRecord({
                type: 'estimateFields',
                id: option.estimate,
                data: arrEstimateLines,
                removeLines: arrEstRemoveLines,
                method: METHOD_ADDITEMS,
                option: {
                    estid: option.estimate
                },
                cf: libFieldAndDefaultValue.customForms.estimate
            });

            return estimateId // estid
        }

        return {
            calculateSummary,
            updateCart,
            crudCartItem,
            getDataToBeDeleted,
            updateEstimateRecord
        }

    });