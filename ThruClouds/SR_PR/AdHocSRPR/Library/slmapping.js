/**
 * @NApiVersion 2.1
 */
define([],

    () => {

        const SUITELET = {
            scriptid: 'customscript_adhoc_consolidation_sl',
            deploymentid: 'customdeploy_adhoc_consolidation_sl',
            form: {
                title: "ADHOC CONSOLIDATION",
                fields: {
                    TRANSACTION_TYPE: {
                        id: "custpage_trans_type",
                        type: "SELECT",
                        label: "TRANSACTION TYPE",
                        ismandatory: true,
                        hasoption: true,
                    },
                    FROM_DATE: {
                        id: "custpage_from_date",
                        type: "DATE",
                        label: "Date From",
                        ismandatory: true
                    },
                    TO_DATE: {
                        id: "custpage_to_date",
                        type: "DATE",
                        label: "Date To",
                        ismandatory: true,
                    },
                    FROM_OUTLET: {
                        id: "custpage_from_location",
                        type: "SELECT",
                        label: "From Outlet",
                        source: 'location',
                        ismandatory: true,
                    },
                    TO_OUTLET: {
                        id: "custpage_to_location",
                        type: "SELECT",
                        label: "To Outlet",
                        source: 'location',
                    },
                },
                buttons: {
                    SEARCH_ITEM: {
                        label: 'SEARCH',
                        id: 'custpage_search_btn',
                        functionName: 'searchItems'
                    },
                    SUBMIT: {
                        label: 'SUBMIT'
                    },
                    REFRESH: {
                        label: 'REFRESH',
                        id: 'custpage_reset_btn',
                        functionName: 'refreshPage'
                    },

                },
                sublistfields: {
                    VIEW: {
                        id: "custpage_view",
                        label: "VIEW",
                        type : 'text',
                    },
                    DOCUMENT_NO: {
                        id: "custpage_document_no",
                        label: "DOCUMENT NO.",
                        type : 'text',
                    },
                    DATE: {
                        id: "custpage_date",
                        label: "DATE",
                        type : 'text',
                    },
                },
                selectOptions: {
                    EMPTY: {
                        value: '',
                        text: ''
                    },
                    STOCK_REQUISITION: {
                        value: 'SR',
                        text: 'Stock Requisition'
                    },
                    PURCHASE_REQUISITION: {
                        value: 'PR',
                        text: 'Purchase Requisition'
                    },
                },
                CS_PATH: '../CS/adhoccs.js',
            },
        }

        return { SUITELET }

    });
