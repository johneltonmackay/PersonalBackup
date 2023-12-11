/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', '../../Library/FieldAndValueMapper/adap_field_and_def_value_mapper.js'],

    function (record, libMapper) {

        const fieldChanged = (context) => {
            let objDiscountRuleRec = context.currentRecord;
            let objApplyToAdatavist = objDiscountRuleRec.getField({
                fieldId: libMapper.discountRuleConfig.fields.isAvstDiscount.id
            });
            let objApplyToCustomer = objDiscountRuleRec.getField({
                fieldId: libMapper.discountRuleConfig.fields.isCustomerDiscount.id
            });
            let objPriceAdjustment = objDiscountRuleRec.getField({
                fieldId: libMapper.discountRuleConfig.fields.isPriceAdj.id
            });
            try {
                if (context.fieldId == libMapper.discountRuleConfig.fields.isAvstDiscount.id) {
                    let blnApplyToAdaptavist = objDiscountRuleRec.getValue({
                        fieldId: libMapper.discountRuleConfig.fields.isAvstDiscount.id
                    });
                    if (blnApplyToAdaptavist){
                        objDiscountRuleRec.setValue({
                            fieldId: libMapper.discountRuleConfig.fields.isAvstDiscount.id,
                            value: true,
                            ignoreFieldChange: true
                        });
                        objApplyToAdatavist.isDisabled = false
                        objDiscountRuleRec.setValue({
                            fieldId: libMapper.discountRuleConfig.fields.isCustomerDiscount.id,
                            value: false,
                            ignoreFieldChange: true
                        });
                        objApplyToCustomer.isDisabled = true
                        objDiscountRuleRec.setValue({
                            fieldId: libMapper.discountRuleConfig.fields.isPriceAdj.id,
                            value: false,
                            ignoreFieldChange: true
                        });
                        objPriceAdjustment.isDisabled = true
                    } else {
                        objDiscountRuleRec.setValue({
                            fieldId: libMapper.discountRuleConfig.fields.isAvstDiscount.id,
                            value: false,
                            ignoreFieldChange: true
                        });
                        objApplyToAdatavist.isDisabled = true
                        objDiscountRuleRec.setValue({
                            fieldId: libMapper.discountRuleConfig.fields.isCustomerDiscount.id,
                            value: true,
                            ignoreFieldChange: true
                        });
                        objApplyToCustomer.isDisabled = false
                        objDiscountRuleRec.setValue({
                            fieldId: libMapper.discountRuleConfig.fields.isPriceAdj.id,
                            value: true,
                            ignoreFieldChange: true
                        });
                        objPriceAdjustment.isDisabled = false
                    }
                }
                if (context.fieldId == libMapper.discountRuleConfig.fields.isCustomerDiscount.id){
                    let blnApplyToCustomer = objDiscountRuleRec.getValue({
                        fieldId: libMapper.discountRuleConfig.fields.isCustomerDiscount.id
                    });
                    if (blnApplyToCustomer){
                        objDiscountRuleRec.setValue({
                            fieldId: libMapper.discountRuleConfig.fields.isCustomerDiscount.id,
                            value: true,
                            ignoreFieldChange: true
                        });
                        objApplyToCustomer.isDisabled = false
                        objDiscountRuleRec.setValue({
                            fieldId: libMapper.discountRuleConfig.fields.isAvstDiscount.id,
                            value: false,
                            ignoreFieldChange: true
                        });
                        objApplyToAdatavist.isDisabled = true
                        objPriceAdjustment.isDisabled = false
                    } else {
                        objDiscountRuleRec.setValue({
                            fieldId: libMapper.discountRuleConfig.fields.isAvstDiscount.id,
                            value: true,
                            ignoreFieldChange: true
                        });
                        objApplyToAdatavist.isDisabled = false
                        objDiscountRuleRec.setValue({
                            fieldId: libMapper.discountRuleConfig.fields.isCustomerDiscount.id,
                            value: false,
                            ignoreFieldChange: true
                        });
                        objApplyToCustomer.isDisabled = true
                        objDiscountRuleRec.setValue({
                            fieldId: libMapper.discountRuleConfig.fields.isPriceAdj.id,
                            value: false,
                            ignoreFieldChange: true
                        });
                        objPriceAdjustment.isDisabled = true
                    }
                }
                
            } catch(e) {
                log.error({
                    title: 'ERROR: fieldChanged',
                    details: e.message
                });
            }
        };

        return {
            fieldChanged
        };

    });           
