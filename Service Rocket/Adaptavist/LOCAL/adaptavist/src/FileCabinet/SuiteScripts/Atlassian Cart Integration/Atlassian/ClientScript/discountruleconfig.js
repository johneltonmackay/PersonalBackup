/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record'],

    function (record) {

        const pageInit = (context) => {
            console.log("TEST")
        };

        const fieldChanged = (context) => {
            try {
                let objDiscountRuleRec = context.currentRecord;
                let objApplyToAdatavist = objDiscountRuleRec.getField({
                    fieldId: 'custrecord_adap_atl_disc_is_adaptavist'
                });
                let objApplyToCustomer = objDiscountRuleRec.getField({
                    fieldId: 'custrecord_adap_atl_disc_is_customer'
                });
                let objPriceAdjustment = objDiscountRuleRec.getField({
                    fieldId: 'custrecord_adap_atl_disc_price_adj'
                });
                if (context.fieldId === 'custrecord_adap_atl_disc_is_adaptavist') {
                    let blnApplyToAdaptavist = objDiscountRuleRec.getValue({
                        fieldId: 'custrecord_adap_atl_disc_is_adaptavist'
                    });
                    if (blnApplyToAdaptavist){
                        // objDiscountRuleRec.setValue({
                        //     fieldId: 'custrecord_adap_atl_disc_is_customer',
                        //     value: false,
                        //     ignoreFieldChange: true
                        // });
                        // objDiscountRuleRec.setValue({
                        //     fieldId: 'custrecord_adap_atl_disc_price_adj',
                        //     value: false,
                        //     ignoreFieldChange: true
                        // });
                        objApplyToAdatavist.isDisabled = false;
                        objApplyToCustomer.isDisabled = true;
                        objPriceAdjustment.isDisabled = true;
                    } else {
                        // objDiscountRuleRec.setValue({
                        //     fieldId: 'custrecord_adap_atl_disc_is_customer',
                        //     value: true,
                        //     ignoreFieldChange: true
                        // });
                        // objDiscountRuleRec.setValue({
                        //     fieldId: 'custrecord_adap_atl_disc_price_adj',
                        //     value: true,
                        //     ignoreFieldChange: true
                        // });
                        objApplyToAdatavist.isDisabled = true;
                        objApplyToCustomer.isDisabled = false;
                        objPriceAdjustment.isDisabled = false;
                    }
                }
                if (context.fieldId === 'custrecord_adap_atl_disc_is_customer' || context.fieldId === 'custrecord_adap_atl_disc_price_adj'){
                    let blnApplyToCustomer = objDiscountRuleRec.getValue({
                        fieldId: 'custrecord_adap_atl_disc_is_customer'
                    });
                    let blnPriceAdjustment = objDiscountRuleRec.getValue({
                        fieldId: 'custrecord_adap_atl_disc_price_adj'
                    });
                    if (!blnApplyToCustomer && !blnPriceAdjustment){
                        objApplyToAdatavist.isDisabled = false;
                    } else {
                        objApplyToAdatavist.isDisabled = true;
                    }
                }
                
            } catch(e) {
                log.error({
                    title: 'ERROR: fieldChanged',
                    details: e
                });
            }
        };


       
        return {
            pageInit,
            fieldChanged
        };

    });
