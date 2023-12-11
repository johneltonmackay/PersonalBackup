/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', '../../Library/FieldAndValueMapper/adap_field_and_def_value_mapper.js'],

    function (record, libMapper) {
        const FLD_OVERALL_DISCOUNT_DESC_CHECKBOX = 'custbody_adap_overall_discount_desc';
        const FLD_SHOW_DISCOUNT_CUSTOMER_CHECKBOX = 'custbody_adap_atl_shw_dscnt_to_custmr';
        const FLD_SHOW_DISCOUNT_LINES_CHECKBOX = 'custbody_adap_atl_show_disc_lines';
        const fieldChanged = (context) => {
            console.log("test ABC")
            let objCurrentRec = context.currentRecord;
            let strFieldChanging = context.fieldId;
            var objShowDiscountCol = objCurrentRec.getField({
                fieldId: FLD_OVERALL_DISCOUNT_DESC_CHECKBOX
            });
            try {
                if (strFieldChanging == FLD_SHOW_DISCOUNT_CUSTOMER_CHECKBOX) {
                    var blnOverallDiscount = objCurrentRec.getValue({
                        fieldId: FLD_SHOW_DISCOUNT_CUSTOMER_CHECKBOX
                    });
                    if (blnOverallDiscount) {
                        objCurrentRec.setValue({
                            fieldId: FLD_SHOW_DISCOUNT_LINES_CHECKBOX,
                            value: false,
                            ignoreFieldChange: true
                        });
                        objShowDiscountCol.isDisplay = true;
                    } else {
                        objShowDiscountCol.isDisplay = false;
                    }
                }
                if (strFieldChanging == FLD_SHOW_DISCOUNT_LINES_CHECKBOX){
                    var blnColumnDiscount = objCurrentRec.getValue({
                        fieldId: FLD_SHOW_DISCOUNT_LINES_CHECKBOX
                    });
                    if (blnColumnDiscount) {
                        objCurrentRec.setValue({
                            fieldId: FLD_SHOW_DISCOUNT_CUSTOMER_CHECKBOX,
                            value: false,
                            ignoreFieldChange: true
                        });
                        objShowDiscountCol.isDisplay = false;
                    } else {
                        if (blnOverallDiscount) {
                            objShowDiscountCol.isDisplay = true;
                        }
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
