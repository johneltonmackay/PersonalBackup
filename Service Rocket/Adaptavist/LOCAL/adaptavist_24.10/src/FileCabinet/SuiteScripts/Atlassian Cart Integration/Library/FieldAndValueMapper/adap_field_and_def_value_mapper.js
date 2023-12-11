/**
 * @NApiVersion 2.1
 */
define([],

    () => {
        let STR_ADD_CONTACT_SL = '/app/site/hosting/scriptlet.nl?script=customscript_ada_sl_attach_tech_contact&deploy=customdeploy_ada_sl_attach_tech_contact';
        const CUSTOMER_DISCOUNT = 11988
        const FORM_ATLASSIAN_INTEGRATION = 145
        //let STR_SYNC_SL="'/app/site/hosting/scriptlet.nl?script=customscript_adap_sl_sync_checker&deploy=customdeploy_adap_sl_sync_checker&estId='"
        let STR_SYNC_SL="'/app/site/hosting/restlet.nl?script=customscript_adap_rl_sync_checker&deploy=customdeploy_adap_rl_sync_checker&estId='"

        DEFAULT_VALUES = {
            openStatus: 1,
            closedStatus: 2,
            quotedStatus: 3,
            taxExempt: 5
        }
        let objMapper = {
            mr: {
                parent: 'customscript_adap_atlassianqt_refresh_mr',
                deployment: 'customdeploy_adap_atlassianqt_refresh_mr',
                params: {
                    estimate: 'custscript_adap_atl_refresh_estimate_id'
                }
            },
            mrSaveDraft:{
                scriptId: 'customscript_adap_savedraft_mr',
                deployment: null,
                params: {
                    file: 'custscript_adap_atl_savedraft_opt_file',
                    uniqueId: 'custscript_adap_atl_savedraft_unique_id'
                },
                folderId:735
            },
            customForms: {
                estimate: FORM_ATLASSIAN_INTEGRATION,
                serviceitem: 11,
                contact: 15
            },
            responseCode: {
                response_400: 400,
                response_409: 409,
                response_500: 500,
                response_200: 200
            },
            integrator: {
                METHOD: 'get',
                PATH: '/products/search?productKey=',
                PATH_GET_QUOTE: '/quote/get/',
                PATH_CART_NEW: '/cart/new',
                PATH_CART_ADD: '/cart/add',
                PATH_CART_ADDRENEWALITEM: '/cart/addrenewalitem',
                PATH_CART_ADDUPGRADEITEM: '/cart/addupgradeitem',
                PATH_CART_GET: '/cart/get/',
                PATH_CART_REMOVE: '/cart/remove',
                PATH_CART_TOORDER: '/cart/toorder',
                PATH_CART_DETAILS: '/cart/details',
                PATH_CART_GETUPGRADEOPTIONS: '/cart/getupgradeoptions',
                PATH_CART_GETRENEWALOPTIONS: '/cart/getrenewaloptions',
                PRODUCT_SEARCH: '/products/search',
                PRODUCT_ADDONS: '/addons',
                URL_PARAM: 'confluence-data-center',
                INTEGRATION: 'adap_hamlet'
            },
            suitelet: {
                SCRIPT: 'customscript_adap_atlassiancart_op_sl',
                DEPLOYMENT: 'customdeploy_adap_atlassiancart_op_sl'
            },
            sublists: {
                item: 'item'
            },
            estimateFields: {
                id: 'estimate',
                fields: {
                    cf: {id: 'cf', type: 'value', default: FORM_ATLASSIAN_INTEGRATION},
                    customform: {id: 'customform', type: 'value', default: FORM_ATLASSIAN_INTEGRATION},
                    customerId: {id: 'entity', type: 'value'},
                    subsidiaryId: {id: 'subsidiary', type: 'value'},
                    purchaseOrderNumber: {id: 'otherrefnum', type: 'value'},
                    refreshQuoteStatus: {id: 'custbody_adap_atl_refresh_status', type: 'value'},
                    currencyId: {id: 'currency', type: 'value'},
                    tcId: {id: 'custbody_adap_tc_option', type: 'value'},
                    tcAdditionalContent: {id: 'custbody_adap_tc_add_notes', type: 'value'},
                    tcContent: {id: 'custbody_adap_tc_option_content', type: 'value'},
                    techContactName: {id: 'custbody_atl_tech_contact_name', type: 'value'},
                    techContactEmail: {id: 'custbody_atl_tech_contact_email', type: 'value'},
                    salesRepId: {id: 'salesrep', type: 'value'},
                    currencyBuffer: {id: 'custbody_adap_currency_rate_buffer', type: 'value'},
                    macAccount: {id: 'custbody_adap_atl_mac_account', type: 'value'},
                    discountitem: {id: 'discountitem', type: 'value', default: CUSTOMER_DISCOUNT},
                    discountrate: {id: 'discountrate', type: 'value'},

                    //checkboxes
                    includeInReport: {id: 'custbody_adap_atl_include_in_report', type: 'checkbox'},
                    addSignatureBlock: {id: 'custbody_adap_signature_block', type: 'checkbox'},
                    showDiscountToCustomer: {id: 'custbody_adap_atl_shw_dscnt_to_custmr', type: 'checkbox'},
                    showColumnDiscount: {id: 'custbody_adap_atl_show_disc_lines', type: 'checkbox'},
                    csURL: {id: 'custbody_adap_atl_cs_url', type: 'value'},
                    isPartner: {id: 'custbody_adap_enduser_ispartner', type: 'checkbox'},
                    taxOverride: {id: 'custbody_ava_taxoverride', type: 'checkbox'},
                    errorMessages: {id:'custbody_adap_fail_reason', type:'text'},
                    totalAvstPrice: {
                        id: 'custbody_adap_total_avst_price',
                        type: 'currency',
                        lineCounterPart: 'avstTotal'
                    },
                    totalAvstDiscount: {
                        id: 'custbody_adap_total_avst_discount',
                        type: 'currency',
                        lineCounterPart: 'avstDiscountAmount'
                    },
                    totalCreditAmount: {
                        id: 'custbody_adap_total_cust_credit',
                        type: 'currency',
                        lineCounterPart: 'creditAmount'
                    },
                    totalCustomerPrice: {
                        id: 'custbody_adap_total_cust_price',
                        type: 'currency',
                        lineCounterPart: 'customerPrice'
                    },
                    totalMargin: {id: 'custbody_adap_total_margin', type: 'currency', lineCounterPart: 'margin'},
                    totalMarginPercentage: {
                        id: 'custbody_adap_total_margin_percent',
                        type: 'currency',
                        lineCounterPart: 'marginPercent'
                    },
                    totalCustomerDiscount: {
                        id: 'custbody_adap_total_customer_discount',
                        type: 'currency',
                        lineCounterPart: 'discount'
                    },
                    totalTransactionDiscount: {
                        id: 'discountrate',
                        type: 'currency',
                        lineCounterPart: 'transactionDiscountRate'
                    },
                    totalDiscountRate: {
                        id: 'custbody_adap_total_discount_percent',
                        type: 'currency',
                        lineCounterPart: 'customerDiscountRate'
                    },

                    totalLines: {id: 'custbody_adap_total_lines', type: 'currency',},
                    totalQuotes: {id: 'custbody_adap_total_quotes', type: 'currency',},
                    generatedQotes: {id: 'custbody_adap_total_gen_quotes', type: 'currency',},
                    importedQuotes: {id: 'custbody_adap_total_imported_quotes', type: 'currency',},
                    openQuotes: {id: 'custbody_adap_total_open_quotes', type: 'currency',},

                    totalListPrice: {
                        id: 'custbody_adap_total_listprice',
                        type: 'currency',
                        lineCounterPart: 'listPrice'
                    },
                    totalNewListPrice: {
                        id: 'custbody_adap_total_listpricewadjust',
                        type: 'currency',
                        lineCounterPart: 'newListPrice'
                    },
                    totalListPriceAdjustment: {
                        id: 'custbody_adap_total_listpriceadjust',
                        type: 'currency',
                        lineCounterPart: 'priceAdjustment'
                    },
                    totalUpgradeCredit: {
                        id: 'custbody_adap_total_upgrade',
                        type: 'currency',
                        lineCounterPart: 'upgradeCredit'
                    },
                    usdConversion: {id: 'custbody_adap_usd_conversion', type: 'currency',},
                    toUsdConversion: {id: 'custbody_adap_atl_tran_curncy_to_usd', type: 'currency',},

                    endUserName: {id: 'custbody_adap_enduser_name', type: 'value'},
                    endUserEmail: {id: 'custbody_adap_enduser_email', type: 'value'},
                    endUserPhone: {id: 'custbody_adap_enduser_phone', type: 'value'},
                    endUserAddr1: {id: 'custbodyadap_enduser_address1', type: 'value'},
                    endUserAddr2: {id: 'custbody_enduser_address2', type: 'value'},
                    endUserCity: {id: 'custbody_adap_enduser_city', type: 'value'},
                    endUserZip: {id: 'custbody_adap_enduser_zip', type: 'value'},
                    endUserCountry: {id: 'custbody_adap_enduser_country', type: 'value'},
                    endUserState: {id: 'custbody_adap_enduser_state', type: 'value'},
                    cartIdentifier: {id: 'custbody_adap_atl_refresh_status', type: 'value'},
                },
                sublist: {
                    item: {
                        itemId: {id: 'item', type: 'value'},
                        newListPrice: {
                            id: 'custcol_adap_atl_item_newlistprice',
                            type: 'currency',
                            headerCounterPart: 'totalNewListPrice',
                            hasBuffer: true
                        },
                        newListPrice_rate: {id: 'rate', type: 'currency', inputType: 'special', hasBuffer: true},
                        /*lineItemRate*/
                        newListPrice_amount: {id: 'amount', type: 'currency', inputType: 'special', hasBuffer: true},
                        avstTotal: {
                            id: 'custcol_adap_atl_item_avst_total',
                            type: 'currency',
                            headerCounterPart: 'totalAvstPrice',
                            hasBuffer: true
                        },
                        margin: {
                            id: 'custcol_adap_atl_margin_amount',
                            type: 'currency',
                            headerCounterPart: 'totalMargin',
                            hasBuffer: true
                        },
                        creditAmount: {
                            id: 'custcol_adap_atl_customer_credit',
                            type: 'currency',
                            headerCounterPart: 'totalCreditAmount',
                            hasBuffer: true
                        },
                        listPrice: {
                            id: 'custcol_adap_atl_cart_item_inilstprc',
                            type: 'currency',
                            headerCounterPart: 'totalListPrice',
                            hasBuffer: true
                        },
                        customerPrice: {
                            id: 'custcol_adap_item_customer_price',
                            type: 'currency',
                            headerCounterPart: 'totalCustomerPrice',
                            hasBuffer: true
                        },
                        costestimate: {id: 'costestimatetype', type: 'text', default: 'CUSTOM'},
                        quantity: {id: 'quantity', type: 'value', default: 1},
                        cartId: {id: 'custcol_adap_atlassian_cart_holder', type: 'value', inputType: 'number'},
                        cartitemid: {id: 'custcol_adap_atl_cart_item', type: 'value'},
                        description: {id: 'description', type: 'text'},
                        customerDiscountAmount: {
                            id: 'custcol_adap_atl_item_disc_lines',
                            type: 'currency',
                            headerCounterPart: 'totalCustomerDiscount',
                            hasBuffer: true
                        },
                        customerDiscountRate: {
                            id: 'custcol_adap_atl_item_disc_lines_prc',
                            type: 'currency',
                            inputType: 'special',
                            headerCounterPart: 'totalDiscountRate',
                            hasBuffer: true,
                            ignoreConversion:true
                        },
                        tierNumber: {id: 'custcol_adap_atl_item_unit_tier', type: 'value'},
                        avstDiscountAmount: {
                            id: 'custcol_adap_atl_item_disc_avst',
                            type: 'currency',
                            headerCounterPart: 'totalAvstDiscount',
                            hasBuffer: true
                        },
                        upgradeCredit: {
                            id: 'custcol_adap_atl_item_disc_amount',
                            type: 'currency',
                            headerCounterPart: 'totalUpgradeCredit',
                            hasBuffer: true
                        },
                        priceAdjustment: {
                            id: 'custcol_adap_atl_item_price_adj',
                            type: 'currency',
                            headerCounterPart: 'totalListPriceAdjustment',
                            hasBuffer: true
                        },
                        id: {id: 'custcol_adap_atl_item_id', type: 'text'},
                        cloudSiteHostname: {id: 'custcol_adap_atl_import_url', type: 'url'},
                        startDate: {id: 'custcol_product_start_date', type: 'date',},
                        endDate: {id: 'custcol_product_end_date', type: 'date',},
                        senNumber: {id: 'custcol_adap_atl_sen_number', type: 'value'},
                        supportEntitlementNumber: {id: 'custcol_adap_atl_sen_number', type: 'value'},
                        licenseType: {id: 'custcol_adap_atl_license', type: 'value'},
                        saleType: {id: 'custcol_adap_atl_saletype', type: 'value'},
                        totalDiscount: {id: 'custcol_adap_item_total_discount', type: 'currency'},
                        orderRefNum: {id: 'custcol_adap_atl_order_ref_num', type: 'text'},
                        cloudId: {id: 'custcol_adap_atl_cloudid', type: 'text'},
                        maintenanceMonths: {id: 'custcol_adap_maintenance_period', type: 'value'},
                        techName: {id: 'custcol_adap_tech_name', type: 'value'},
                        techEmail: {id: 'custcol_adap_tech_email', type: 'value'},
                        taxRate1: {id: 'taxrate1', type: 'value'},
                        taxRate2: {id: 'taxrate2', type: 'value'},
                        taxAmt1: {id: 'tax1amt', type: 'value'},
                        taxCode: {id: 'taxcode', type: 'text'},
                        line: {id: 'line', type: 'value'},
                        sortedItems: {id: 'custpage_sorted_items', type: 'value'},
                        currency: {id: 'custcol_adap_atl_selected_currency', type: 'value'},
                        unfixedValues: {id: 'custcol_adap_atl_unfixed_values', type: 'value'},
                    }
                }
            },
            atlassianCart: {
                id: 'customrecord_adap_atlassian_cart',
                fields: {
                    quoteId: {id: 'name', type: 'value'},
                    cartEstimate: {id: 'custrecord_adap_at_cart_estimate', type: 'value'},
                    cartUuid: {id: 'custrecord_adap_at_cart_uuid', type: 'value'},
                    serialNumber: {id: 'custrecord_adap_at_serial_number', type: 'value'},
                    generateDate: {id: 'custrecord_adap_at_quote_date', type: 'date'},
                    totalAvstPrice: {id: 'custrecord_adap_at_cart_total_avst_price', type: 'value'},
                    //totalAvstDiscount
                    totalCustomerPrice: {id: 'custrecord_adap_at_cart_total_amount', type: 'value'},
                    totalCreditAmount: {id: 'custrecord_adap_at_cart_total_cust_cred', type: 'value'},
                    totalMargin: {id: 'custrecord_adap_at_cart_total_margin', type: 'value'},
                    totalCustomerDiscount: {id: 'custrecord_adap_at_cart_total_cust_disc', type: 'value'},
                    totalDiscountRate: {id: 'custrecord_adap_at_cart_quote_total_disc', type: 'value'},
                    totalListPrice: {id: 'custrecord_adap_at_cart_total_list', type: 'value'},
                    totalNewListPrice: {id: 'custrecord_adap_atl_cart_new_listprice', type: 'value'},
                    totalListPriceAdjustment: {id: 'custrecord_adap_at_cart_ttl_lst_prc_adj', type: 'value'},

                    created: {id: 'custrecord_adap_at_cart_created_date', type: 'date'},
                    createdDate: {id: 'custrecord_adap_at_cart_created_date', type: 'date'},
                    updated: {id: 'custrecord_adap_at_cart_updated_date', type: 'date'},
                    dueDate: {id: 'custrecord_adap_atl_item_due_date', type: 'date'},
                    purchaseOrderNumber: {id: 'custrecord_adap_at_purchase_order', type: 'value'},
                    status: {id: 'custrecord_adap_at_quote_status', type: 'value', default: DEFAULT_VALUES.openStatus},
                    additionalNotes: {id: 'custrecord_adap_at_memo', type: 'value'},
                    expertOrder: {id: 'custrecord_adap_at_expertorder', type: 'value'},
                    resellerOrder: {id: 'custrecord_adap_at_resellerorder', type: 'value'},
                    creditCardOnly: {id: 'custrecord_adap_at_credit_card_only', type: 'value'},
                    totalTax: {id: 'custrecord_adap_at_total_tax', type: 'value'},
                    totalProratedPrice: {id: 'custrecord_adap_at_total_prorated_price', type: 'text'},
                    totalAvstDiscount: {id: 'custrecord_adap_at_total_discount_amount', type: 'value'},
                    quoteDataJson: {id: 'custrecord_adap_at_quote_data_json', type: 'value', json: false},
                    quoteRefreshDataJson: {id: 'custrecord_adap_at_qt_data_refresh_json', type: 'value', json: false},
                    estimate: {id: 'custrecord_adap_at_cart_estimate', type: 'value'},
                    isQuoteUpdated: {id: 'custrecord_adap_at_isquote_updated', type: 'value'},
                    quoteLink: {id: 'custrecord_adap_atl_quote_pdf_link', type: 'value'},
                    originalDraftData: {id: 'custrecord_adap_at_draft_data_json', type: 'value'},
                }
            },
            atlassianCartItem: {
                id: 'customrecord_adap_atlassian_cart_item',
                fields: {
                    itemId: {id: 'custrecord_adap_atl_product', type: 'value'},
                    tierNumber: {id: 'custrecord_adap_atl_tier', type: 'value'},
                    maintenanceMonths: {id: 'custrecord_adap_atl_maintenance_month', type: 'value'},
                    description: {id: 'custrecord_adap_cart_item_desc', type: 'value'},
                    id: {id: 'custrecord_adap_atl_cart_item_order_id', type: 'value'},
                    senNumber: {id: 'custrecord_adap_atl_sen_number', type: 'value'},
                    supportEntitlementNumber: {id: 'custrecord_adap_atl_sen_number', type: 'value'},
                    licenseType: {id: 'custrecord_adap_atl_license', type: 'value'},
                    saleType: {id: 'custrecord_adap_atl_saletype', type: 'value'},
                    cloudSiteHostname: {id: 'custrecord_adap_atl_item_cloudsite', type: 'url'},
                    startDate: {id: 'custrecord_adap_atl_item_startdate', type: 'date'},
                    endDate: {id: 'custrecord_adap_atl_item_enddate', type: 'date'},
                    listPrice: {id: 'custrecord_adap_atl_cart_item_list_price', type: 'value'},
                    newListPrice: {id: 'custrecord_adap_atl_cart_item_newlistprc', type: 'value'},
                    priceAdjustment: {id: 'custrecord_adap_atl_crt_itm_price_adjust', type: 'value'},
                    upgradeCredit: {id: 'custrecord_adap_atl_crt_itm_discount', type: 'value'},
                    avstDiscountAmount: {id: 'custrecord_adap_atl_item_disc_avst', type: 'value'},
                    avstTotal: {id: 'custrecord_adap_atl_avst_total', type: 'value'},
                    customerDiscountAmount: {id: 'custrecord_adap_atl_crt_itm_disc_cust', type: 'value'},
                    customerDiscountRate: {id: 'custrecord_adap_atl_item_discount_per', type: 'value', ignoreConversion:true},
                    customerPrice: {id: 'custrecord_adap_atl_cart_item_cust_price', type: 'value'},
                    totalDiscount: {id: 'custrecord_adap_atl_crt_itm_dsc_total', type: 'value'},
                    totalTax: {id: 'custrecord_adap_atl_tax_line', type: 'value'},
                    creditAmount: {id: 'custrecord_adap_atl_credit_amount', type: 'value'},
                    cartId: {id: 'custrecord_adap_atl_cart_parent', type: 'value'},
                    margin: {id: 'custrecord_adap_atl_quote_margin', type: 'value'},
                    additionalNotes: {id: 'custrecord_adap_atl_additional_notes', type: 'value'},
                    productId: {id: 'custrecord_adap_atl_quote_product_id', type: 'value'},
                    cloudId: {id: 'custrecord_adap_atl_cloudid', type: 'text'},
                }
            },
            discountRuleConfig:{
                id:'customrecord_adap_alt_discount',
                fields:{
                    isAvstDiscount: {id: 'custrecord_adap_atl_disc_is_adaptavist', type: 'value'},
                    isCustomerDiscount: {id: 'custrecord_adap_atl_disc_is_customer', type: 'value'},
                    isPriceAdj: {id: 'custrecord_adap_atl_disc_price_adj', type: 'value'},
                }
            },
            netsuiteEstimateItems: {
                id: 'estimate',
                fields: {
                    nsid: {id: 'item', type: 'value'},
                    quantity: {id: 'quantity', default: 1, type: 'value'},
                    customerPrice: {id: 'amount', type: 'value'},
                    cartId: {id: 'custcol_adap_atlassian_cart_holder', type: 'value'},
                    description: {id: 'description', type: 'value'}
                }
            },
            companyDefaultBillingToPayload: {
                organisationName: 'companyname',
                address1: 'addr1',
                city: 'city',
                isoCountryCode: 'country',
                country: 'country',
                postcode: 'zip',
                state: 'state'
            },
            EndUserAddressToPayload: {
                'technicalisocountrycode': 'technicalcountrycode',
                'billingcountry': 'country',
                'billingaddress1': 'address1',
                'billingaddress2': 'address2',
                'billingtaxid': 'taxid',
                'billingisocountrycode': 'country_code',
                'billingstate': 'state',
                'billingcity': 'city',
                'billingorganisationname': 'org_name',
                'billingpostcode': 'zip',
            },
            addCartDetails: {
                "uuid": "uuid",
                "purchaserContactDetails": {
                    "email": {id: "purchaseremail", default: ''},
                    "firstName": {id: "purchaserfirstname", default: ''},
                    "lastName": {id: "purchaserlastname", default: ''},
                    "phone": {id: "purchaserphone", default: '0000000'},
                },
                "technicalContactDetails": {
                    "firstName": {id: "technicalfirstname", default: ''},
                    "lastName": {id: "technicallastname", default: ''},
                    "email": {id: "technicalemail", default: ''},
                    "phone": {id: "technicalphone", default: '0000000'},
                },
                "technicalOrganisationDetails": {
                    "xeroId": {id: "xeroid", default: ''},
                    "organisationName": {id: "technicalorganisationname", default: ''},
                    "address1": {id: "technicaladdress1", default: ''},
                    "address2": {id: "technicaladdress2", default: ''},
                    "taxId": {id: "technicaltaxid", default: ''},
                    "city": {id: "technicalcity", default: ''},
                    "state": {id: "technicalstate", default: null},
                    "country": {id: "technicalcountry", default: ''},
                    "isoCountryCode": {id: "technicalisocountrycode", default: ''},
                    "postcode": {id: "technicalpostcode", default: null},
                },
                "billingContactDetails": {
                    "firstName": {id: "billingfirstname", default: ''},
                    "lastName": {id: "billinglastname", default: ''},
                    "email": {id: "billingemail", default: ''},
                    "phone": {id: "billingphone", default: '0000000'},
                },
                "billingOrganisationDetails": {
                    "country": {id: "billingcountry", default: ''},
                    "address1": {id: "billingaddress1", default: ''},
                    "address2": {id: "billingaddress2", default: ''},
                    "taxId": {id: "billingtaxid", default: ''},
                    "isoCountryCode": {id: "billingisocountrycode", default: ''},
                    "state": {id: "billingstate", default: ''},
                    "city": {id: "billingcity", default: ''},
                    "organisationName": {id: "billingorganisationname", default: ''},
                    "postcode": {id: "billingpostcode", default: ''},
                }
            },
            estimateAtlassianCartUpdateFields: {
                cart: 'custcol_adap_atlassian_cart_holder',
                cartItem: 'custcol_adap_atl_cart_item'
            },
            // addressSubRecord: ['billingaddress', 'shippingaddress'],
            addressSubRecord: ['shippingaddress'],
            endUserAddress: {
                custbody_adap_enduser_country: 'country',
                custbody_adap_enduser_state: 'state',
                custbody_adap_enduser_name: 'addressee',
                custbodyadap_enduser_address1: 'addr1',
                custbody_enduser_address2: 'addr2',
                custbody_adap_enduser_city: 'city',
                custbody_adap_enduser_zip: 'zip',
            },
            defaultBillAddress: {
                country: 'country',
                state: 'state',
                addressee: 'addressee',
                addr1: 'addr1',
                addr2: 'addr2',
                city: 'city',
                zip: 'zip',
                billaddress: 'addressbookaddress'
            },
            defaultShipAddress: {
                country: 'country',
                state: 'state',
                addressee: 'addressee',
                addr1: 'addr1',
                addr2: 'addr2',
                city: 'city',
                zip: 'zip',
                shipaddress: 'addressbookaddress'
            },
            inlineEventListener: `<script>
                    function handleAttachButtonClick() {
                      var contactIdInput = document.getElementById("contacts_contact_display");
                      var invoiceId = document.getElementById("id");
                      var contactToAdd = contactIdInput.value;
                      
                      if (invoiceId) {
                        console.log(invoiceId.value);
                        console.log("contactToAdd: " + contactToAdd);
                        let intId = invoiceId.value;
                        var contactWithoutAmpersand = contactToAdd.replace(/[^a-zA-Z0-9: ]/g, '');
                        var strNewUrl = "${STR_ADD_CONTACT_SL}&estId=" + intId + "&contact=" + contactWithoutAmpersand;
                        console.log(strNewUrl);
                        window.location.href = strNewUrl;
                      } else {
                        console.log("Checkbox element not found.");
                      }
                    }
                
                    var intContact = "";
                    
                    document.addEventListener("DOMContentLoaded", function() {
                      var attachContact = document.getElementById("addcontact");
                      
                      if (attachContact) {
                        attachContact.addEventListener("click", handleAttachButtonClick);
                      } else {
                        console.log("attachContact button element not found.");
                      }
                    });
                    
                 
                  </script>`,
            refreshCheckerScript:` <script>
                               window.addEventListener('load', fetchData);

                                function displayAlert(message) {
                                  alert(message);
                                }
                                
                                async function fetchData() {
                                  let invoiceId = document.getElementById("id");
                                  if (invoiceId) {
                                    let intId = invoiceId.value;
                                    const url = ${STR_SYNC_SL} + intId;
                                    console.log(url);
                                
                                    try {
                                      const response = await fetch(url);
                                      if (response.ok) {
                                        const data = await response.text();
                                        console.log('Data received: ', data);
                                        let isForRefresh = getParameterFromURL('isForRefresh');
                                        console.log('isForRefresh ', isForRefresh);
                                
                                        // if (!isForRefresh) {
                                          if (data === 'false') {
                                            console.log('isnotSynced');
                                            // Add the parameter to the current URL and refresh the page.
                                            displayAlert("A cart is out-of-sync. Page will reload to enable the Refresh Quote button.");
                                            window.location.href = window.location.href + '&isSynced=false';
                                            // Store the 'isSynced' state in localStorage.
                                            localStorage.setItem('isSynced', 'false');
                                          } else if (data === 'true') {
                                            let isSyncedVar = getParameterFromURL('isSynced');
                                            console.log('isSyncedVar', isSyncedVar);
                                
                                            if (isSyncedVar === 'false') {
                                              removeParameterFromURL('isSynced');
                                            }
                                          }
                                        // } else {
                                        //   if (data === 'true') {
                                        //       removeParameterFromURL('isForRefresh')
                                        //   }
                                        // }
                                      } else {
                                        console.error('Failed to fetch data');
                                      }
                                    } catch (error) {
                                      console.error('Error:', error);
                                    }
                                  }
                                }
                                
                                function getParameterFromURL(parameterName) {
                                  const queryString = window.location.search;
                                  const urlParams = new URLSearchParams(queryString);
                                  return urlParams.get(parameterName);
                                }
                                
                                function removeParameterFromURL(parameterName) {
                                  const url = window.location.href;
                                  const urlParts = url.split('?');
                                  console.log('url', url);
                                
                                  if (urlParts.length > 1) {
                                    const parameters = urlParts[1].split('&');
                                    const updatedParameters = parameters.filter(param => !param.startsWith(parameterName));
                                    const updatedURL = urlParts[0] + (updatedParameters.length > 0 ? '?' + updatedParameters.join('&') : '');
                                    console.log('updatedURL', updatedURL);
                                    window.location.href = updatedURL;
                                  }
                                }
                            // // Call fetchData() immediately to fetch data as soon as the script runs.
                            // fetchData();
                            //
                            // // Use a recursive function to call fetchData() with a delay (e.g., 30 seconds) between requests.
                            // function fetchDataWithDelay() {
                            //   fetchData()
                            //     .then(() => {
                            //       setTimeout(fetchDataWithDelay, 5000); // 30 seconds
                            //     });
                            // }
                            //
                            // // Start the recursive fetchDataWithDelay function.
                            // fetchDataWithDelay();
                                 </script>
                                `,
            inlineInvoiceEventListener: `<script>
                        function createInvoiceButtonClick() {
                          var blnIncludeInReport = "{{includeInReport}}";
                          console.log("blnIncludeInReport:", blnIncludeInReport);
                    
                          if (blnIncludeInReport === "false") {
                            if (confirm('The "Include In Report" checkbox is unchecked. Would you like to proceed?')) {
                              console.log("Invoice creation started!");
                            } else {
                              console.log("Invoice creation canceled.");
                             var strNewUrl = window.location.href;
                              console.log("New URL:", strNewUrl);
                              window.location.href = strNewUrl;
                            }
                          }
                        }
                    
                        var createInvoiceButton = document.getElementById("createinvoice");
                        if (createInvoiceButton) {
                          createInvoiceButton.addEventListener("click", createInvoiceButtonClick);
                        } else {
                          console.log("createInvoiceButton element not found.");
                        }
                      </script>`,
            // kune
            SUITELET_JS_DOM_LIB: 390,
            quoteForRefreshField: 'custrecord_adap_at_isquote_updated',
            environment: {
                sandbox: 1,
                production: 2,
            },
            licenseType: {
                UPGRADE: 1,
                RENEWAL: 2,
                NEW: 3,
                COMMERCIAL: 4
            },
            uuid: {
                id: 'custbody_adap_atlassian_uuid',
                type: 'value'
            },
            script: {
                parent: '&script=customscript_adap_atlassiancart_op_sl',
                deployment: '&deploy=customdeploy_adap_atlassiancart_op_sl',
                link: '/app/site/hosting/scriptlet.nl?'
            },
            generateQuoteMR: {
                parent: 'customscript_adap_generatequote_mr',
                deployment: 'customdeploy_adap_generatequote_mr_01',
                params: {
                    estimate: 'custscript_adap_atl_genquote_estimate',
                    mac: 'custscript_adap_atl_genquote_mac',
                    cartid:'custscript_adap_atl_genquote_cartid',
                    errorHandler: 'customscript_adap_generatequote_mr'
                }
            },
            sl: {
                cartDetail: {
                    purchaserContactDetails: {
                        email: 'custscript_adap_cart_detail_purc_email'
                    }
                },
            },
            currency: {
                usd: {id: 5, text: 'USD'}
            },
            keysToIgnoreForUpdate: ['licensedTo', 'isTrialPeriod', 'taxExempt', 'isUnlimitedUsers'],
            netsuiteDiscountRules: {
                id: 'customrecord_adap_alt_discount',
                fields: {
                    discountName: {id: 'name', type: 'text',},
                    discountReason: {id: 'custrecord_adap_atl_disc_reason', type: 'text',},
                    discountType: {id: 'custrecord_adap_atl_disc_type', type: 'text',},
                    discountIsAdaptavist: {
                        id: 'custrecord_adap_atl_disc_is_adaptavist',
                        type: 'checkbox',
                        default: true
                    },
                    discountIsCustomer: {id: 'custrecord_adap_atl_disc_is_customer', type: 'checkbox', default: false},
                    discountIsPriceAdj: {id: 'custrecord_adap_atl_disc_price_adj', type: 'checkbox', default: false},
                    discountDescription: {id: 'custrecord_adap_atl_disc_description', type: 'text',},
                }
            },

            createItemRecord: {
                id: 'serviceitem',
                fields: {
                    productName: {id: 'itemid', type: 'value'},
                    subsidiary: {id: 'subsidiary', type: 'value', default: 3},
                    expenseaccount: {id: 'expenseaccount', type: 'value', default: 809},
                    incomeaccount: {id: 'incomeaccount', type: 'value', default: 516},
                    productId: {id: 'custitem_adap_at_product_id', type: 'value'},
                    addonKey: {id: 'custitem_st_addon_key', type: 'value'},
                    platform: {id: 'custitem_st_hosting', type: 'text'},
                    taxschedule: {id: 'taxschedule', type: 'value', default: 4},
                    includechildren: {id: 'includechildren', type: 'value', default: true},
                    isDoneScripted: {id: 'custitem_atl_item_integrated', type: 'value', default: true},
                    directRevenuePosting: {id: 'directrevenueposting', type: 'value', default: true},
                }
            },
            isInvoiceExist: {
                columns: [
                    {name: "createdfrom", join: "", label: "createdfrom"},
                    {name: "internalid", join: "", label: "internalid"},
                    {name: "type", join: "", label: "type"},
                ]
            },
            platformMappings: {
                CLOUD: "Cloud",
                DATACENTER: "Data Center",
                SERVER: "Server"
            },
            payloadException: ["address2", "taxId", "xeroId", "state", "isoCountryCode"]
        }
        objMapper.cartStatus = DEFAULT_VALUES
        objMapper.scriptLink = '/app/site/hosting/scriptlet.nl?script=customscript_adap_atlassiancart_op_sl&deploy=customdeploy_adap_atlassiancart_op_sl'
        objMapper.isEmpty = (value) => {
            if(typeof value == 'NaN' || typeof value == 'undefined' || typeof value == '') {
                value = false
            }
            return value
        }


        return objMapper

    });