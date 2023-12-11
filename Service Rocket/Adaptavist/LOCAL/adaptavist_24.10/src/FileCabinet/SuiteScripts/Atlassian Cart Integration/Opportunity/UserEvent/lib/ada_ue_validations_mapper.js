define([],
    () => {
        let STR_ADD_CONTACT_SL = 'https://8190294-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?' +
            'script=631&deploy=1&compid=8190294_SB1&h=e6c15044ff27f5f4b4b2';
        let estimateLink = 'https://8190294-sb1.app.netsuite.com/app/accounting/transactions/estimate.nl?id='
        let objMapper = {

            estimateLink: 'https://8190294-sb1.app.netsuite.com/app/accounting/transactions/estimate.nl?id=',
            STR_ENVIRONMENT_ID: 'https://8190294-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?' +
                'script=499&deploy=1&compid=8190294_SB1&h=99b4d83c5154f494de56&action=getRefreshQuote&estimate=',
            customForms: {
                estimate: 145,
                serviceitem: 11,
                contact: 15
            },
            createEstimateHeader: {
                entity: 'customerId',
                salesrep: 'salesRepId',
                subsidiary: 'subsidiaryId',
                currency: 'currencyId',
                custbody_adap_tc_option: 'tcId',
                custbody_adap_tc_option_content: 'tcContent',
                custbody_atl_tech_contact_name: 'techContactName',
                custbody_atl_tech_contact_email: 'techContactEmail',
                custbody_adap_atl_include_in_report: 'includeInReport',
                custbody_adap_signature_block: 'addSignatureBlock',
                custbody_adap_atl_shw_dscnt_to_custmr: 'showDiscountToCustomer',
                custbody_adap_atl_show_disc_lines: 'showColumnDiscount',
                custbody_adap_atl_cs_url: 'csURL',
                custbody_adap_tc_add_notes: 'tcAdditionalContent'
            },
            netsuiteCartItem: {
                id: 'customrecord_adap_atlassian_cart_item',
            },
            netsuiteCart: {
                id: 'customrecord_adap_atlassian_cart',
            },
            sql: {
                getCartMaintenanceMonth: `SELECT
                    BUILTIN_RESULT.TYPE_STRING(CUSTOMRECORD_ADAP_ATLASSIAN_CART.name) AS name,
                    BUILTIN_RESULT.TYPE_STRING(CUSTOMRECORD_ADAP_ATLASSIAN_CART_ITEM.name) AS name_1,
                    BUILTIN_RESULT.TYPE_STRING(CUSTOMRECORD_ADAP_ATLASSIAN_CART_ITEM.custrecord_adap_atl_item_startdate ) AS start_date,
                    BUILTIN_RESULT.TYPE_STRING(CUSTOMRECORD_ADAP_ATLASSIAN_CART_ITEM.custrecord_adap_atl_item_enddate) AS end_date,
                    BUILTIN_RESULT.TYPE_INTEGER(CUSTOMRECORD_ADAP_ATLASSIAN_CART_ITEM.custrecord_adap_atl_maintenance_month) AS custrecord_adap_atl_maintenance_month,
                    BUILTIN_RESULT.TYPE_CLOBTEXT(BUILTIN.DF(CUSTOMRECORD_ADAP_ATLASSIAN_CART.custrecord_adap_at_quote_data_json)) AS custrecord_adap_at_quote_data_json,
                    BUILTIN_RESULT.TYPE_STRING(CUSTOMRECORD_ADAP_ATLASSIAN_CART_ITEM.custrecord_adap_atl_saletype) AS custrecord_adap_atl_saletype
                FROM
                    CUSTOMRECORD_ADAP_ATLASSIAN_CART_ITEM,
                    CUSTOMRECORD_ADAP_ATLASSIAN_CART
                WHERE
                   CUSTOMRECORD_ADAP_ATLASSIAN_CART.ID =  \'{{cartId}}\' AND CUSTOMRECORD_ADAP_ATLASSIAN_CART_ITEM.ID =  \'{{cartItem}}\'`,
                getCustomerDefaultBillAdd: 'SELECT \n' +
                    '  BUILTIN_RESULT.TYPE_STRING(Customer.entityid) AS entityid, \n' +
                    '  BUILTIN_RESULT.TYPE_STRING(customerAddressbook_SUB.addressee) AS addressee, \n' +
                    '  BUILTIN_RESULT.TYPE_STRING(customerAddressbook_SUB.addr1) AS addr1, \n' +
                    '  BUILTIN_RESULT.TYPE_STRING(customerAddressbook_SUB.addr2) AS addr2, \n' +
                    '  BUILTIN_RESULT.TYPE_STRING(customerAddressbook_SUB.city) AS city, \n' +
                    '  BUILTIN_RESULT.TYPE_STRING(BUILTIN.DF(customerAddressbook_SUB.country)) AS country, \n' +
                    '  BUILTIN_RESULT.TYPE_STRING(BUILTIN.DF(customerAddressbook_SUB.dropdownstate)) AS dropdownstate, \n' +
                    '  BUILTIN_RESULT.TYPE_STRING(customerAddressbook_SUB.state) AS state, \n' +
                    '  BUILTIN_RESULT.TYPE_STRING(customerAddressbook_SUB.zip) AS zip, \n' +
                    '   BUILTIN_RESULT.TYPE_STRING(BUILTIN.DF(customerAddressbook_SUB.addressbookaddress)) AS addressbookaddress, \n' +
                    '  BUILTIN_RESULT.TYPE_BOOLEAN(customerAddressbook_SUB.defaultbilling) AS defaultbilling, \n' +
                    '  BUILTIN_RESULT.TYPE_BOOLEAN(customerAddressbook_SUB.defaultshipping) AS defaultshipping\n' +
                    'FROM \n' +
                    '  Customer, \n' +
                    '  (SELECT \n' +
                    '    customerAddressbook.entity AS entity, \n' +
                    '    customerAddressbook.entity AS entity_join, \n' +
                    '    customerAddressbookEntityAddress.addr1 AS addr1, \n' +
                    '   customerAddressbookEntityAddress.addressee AS addressee, \n' +
                    '    customerAddressbook.addressbookaddress AS addressbookaddress, \n' +
                    '    customerAddressbookEntityAddress.addr2 AS addr2, \n' +
                    '    customerAddressbookEntityAddress.city AS city, \n' +
                    '    customerAddressbookEntityAddress.country AS country, \n' +
                    '    customerAddressbookEntityAddress.dropdownstate AS dropdownstate, \n' +
                    '    customerAddressbookEntityAddress.state AS state, \n' +
                    '    customerAddressbookEntityAddress.zip AS zip, \n' +
                    '    customerAddressbook.defaultbilling AS defaultbilling, \n' +
                    '    customerAddressbook.defaultshipping AS defaultshipping, \n' +
                    '    customerAddressbook.defaultbilling AS defaultbilling_crit\n' +
                    '  FROM \n' +
                    '    customerAddressbook, \n' +
                    '    customerAddressbookEntityAddress\n' +
                    '  WHERE \n' +
                    '    customerAddressbook.addressbookaddress = customerAddressbookEntityAddress.nkey(+)\n' +
                    '  ) customerAddressbook_SUB\n' +
                    'WHERE \n' +
                    '  Customer.ID = customerAddressbook_SUB.entity(+)\n' +
                    '   AND ((Customer.ID =\'{{customerId}}\' AND (customerAddressbook_SUB.defaultbilling_crit = \'T\' OR customerAddressbook_SUB.defaultshipping = \'T\')))',
                getTechContactIfExisting: 'SELECT id\n' +
                    'FROM contact\n' +
                    'WHERE firstname = \'{{firstname}}\'\n' +
                    'AND lastname = \'{{lastname}}\'',
                getContactWithEntityId:
                    `SELECT email FROM contact WHERE entityid = {{name}}`,
                geEstimate:
                    `SELECT * FROM transaction WHERE id = {{id}}`,
                getEstimateCarts:
                    'SELECT id FROM customrecord_adap_atlassian_cart where custrecord_adap_at_cart_estimate = {{id}}',
                getAtlCartItems:
                    'SELECT id from customrecord_adap_atlassian_cart_item where custrecord_adap_atl_cart_parent= {{id}}',
                getAtlCartByName:
                    "SELECT id from customrecord_adap_atlassian_cart where name = '{{name}}'",
                getCustomerAddress: "SELECT \n" +
                    "  BUILTIN_RESULT.TYPE_STRING(Customer.email) AS email, \n" +
                    "  BUILTIN_RESULT.TYPE_STRING(Customer.entityid) AS entityid, \n" +
                    "  BUILTIN_RESULT.TYPE_INTEGER(customerAddressbook_SUB.internalid) AS internalid, \n" +
                    "  BUILTIN_RESULT.TYPE_STRING(customerAddressbook_SUB.addr1) AS addr1, \n" +
                    "  BUILTIN_RESULT.TYPE_STRING(customerAddressbook_SUB.city) AS city, \n" +
                    "  BUILTIN_RESULT.TYPE_STRING(BUILTIN.DF(customerAddressbook_SUB.country)) AS country, \n" +
                    "  BUILTIN_RESULT.TYPE_STRING(customerAddressbook_SUB.zip) AS zip,\n" +
                    " BUILTIN_RESULT.TYPE_BOOLEAN(customerAddressbook_SUB.defaultbilling) AS defaultbilling\n" +
                    "FROM \n" +
                    "  Customer, \n" +
                    "  (SELECT \n" +
                    "    customerAddressbook.entity AS entity, \n" +
                    "    customerAddressbook.entity AS entity_join, \n" +
                    "    customerAddressbook.internalid AS internalid, \n" +
                    "    customerAddressbookEntityAddress.addr1 AS addr1, \n" +
                    "    customerAddressbookEntityAddress.city AS city, \n" +
                    "    customerAddressbookEntityAddress.country AS country, \n" +
                    "    customerAddressbookEntityAddress.zip AS zip,\n" +
                    "    customerAddressbook.defaultbilling AS defaultbilling,\n" +
                    "    customerAddressbook.defaultbilling AS defaultbilling_crit\n" +
                    "  FROM \n" +
                    "    customerAddressbook, \n" +
                    "    customerAddressbookEntityAddress\n" +
                    "  WHERE \n" +
                    "    customerAddressbook.addressbookaddress = customerAddressbookEntityAddress.nkey(+)\n" +
                    "  ) customerAddressbook_SUB\n" +
                    "WHERE \n" +
                    "  Customer.ID = customerAddressbook_SUB.entity(+)\n" +
                    "   AND ((Customer.ID = '{{id}}' AND  customerAddressbook_SUB.defaultbilling_crit = 'T'))"
            },
            estimateAtlassianCartUpdateFields: {
                cart: 'custcol_adap_atlassian_cart_holder',
                cartItem: 'custcol_adap_atl_cart_item'
            },
           
            estimateLineToReplicate: {
                itemId: {id: 'item', type: 'value'},
                newListPrice: {id: 'rate', type: 'currency'},
                avstTotal: {id: 'grossamt', type: 'currency'},
                avstTotal2: {id: 'custcol_adap_atl_item_avst_total', type: 'currency'},
                margin: {id: 'custcol_adap_atl_margin_amount', type: 'currency'},
                creditAmount: {id: 'custcol_adap_atl_customer_credit', type: 'currency'},
                newListPrice2: {id: 'custcol_adap_atl_item_newlistprice', type: 'currency'},
                listPrice: {id: 'custcol_adap_atl_cart_item_inilstprc', type: 'currency'},
                customerPrice: {id: 'custcol_adap_item_customer_price', type: 'currency'},
                lineItemRate: {id: 'amount', type: 'currency', inputType: 'special'},
                costestimate: {id: 'costestimatetype', type: 'text', default: 'CUSTOM'},
                quantity: {id: 'quantity', type: 'value', default: 1},
                cartId: {id: 'custcol_adap_atlassian_cart_holder', type: 'value', inputType: 'number'},
                cartitemid: {id: 'custcol_adap_atl_cart_item', type: 'value'},
                description: {id: 'description', type: 'text'},
                discount: {id: 'custcol_adap_atl_item_disc_lines', type: 'currency'},
                discountPercent: {id: 'custcol_adap_atl_item_disc_lines_prc', type: 'currency', inputType: 'special'},
                tierNumber: {id: 'custcol_adap_atl_item_unit_tier', type: 'value'},
                avstDiscountAmount: {id: 'custcol_adap_atl_item_disc_avst', type: 'currency'},
                upgradeCredit: {id: 'custcol_adap_atl_item_disc_amount', type: 'currency'},
                id: {id: 'custcol_adap_atl_order_id', type: 'value'},
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
                taxCode: {id: 'taxcode', type: 'number'},
            },
            inlineEventListener: ' <script>' +
                '  function handleAttachButtonClick() {' +
                '  var contactIdInput  = document.getElementById("contacts_contact_display");' +
                // '  var contactIdInput  = document.getElementById("hddn_contacts_contact_fs");' +
                '  var invoiceId = document.getElementById("id");' +
                '  var contactToAdd = contactIdInput.value;' +
                '  if (invoiceId) {' +
                '  console.log(invoiceId.value);' +
                '  console.log("contactToAdd:" + contactToAdd);' +
                '  let intId = invoiceId.value;' +
                "  var contactWithoutAmpersand = contactToAdd.replace(/[^a-zA-Z0-9: ]/g, '');"+
                '  var strNewUrl="' + STR_ADD_CONTACT_SL + '&estId=' + '"+intId +"&contact="+ contactWithoutAmpersand;' +
                '  console.log(strNewUrl);' +
                '  window.location.href = strNewUrl;' +
                '} else {' +
                '  console.log("Checkbox element not found.");' +
                '}' +
                '}' +

                'var intContact = "";' +
                'document.addEventListener("DOMContentLoaded", function() {' +
                'var attachContact = document.getElementById("addcontact");' +
                // 'var contactElement = document.getElementById("contacts_contact_display").addEventListener("change", handleSelectedContact);' +
                'if (attachContact) {' +
                ' attachContact.addEventListener("click", handleAttachButtonClick);' +
                '} else {' +
                'console.log("attachContact button element not found.");' +
                '}' +

                '});' +
                '</script>',

            inlineInvoiceEventListener: '  <script>   function createInvoiceButtonClick() {\n' +
                '            var blnIncludeInReport = "{{includeInReport}}"; \n' +
                '            console.log("blnIncludeInReport:",blnIncludeInReport); \n' +
                '            if (blnIncludeInReport=="false") {\n' +
                '            if (confirm("The \\"Include In Report\\" checkbox is unchecked. Would you like to proceed?")) {\n' +
                '                console.log("Invoice create!");\n' +

                '            } else {\n' +
                '                console.log("Invoice creation canceled.");\n' +
                '                  var strNewUrl="' + estimateLink + '{{id}}";' +
                '                   console.log(strNewUrl);' +
                '                   window.location.href = strNewUrl;' +
                '            }\n' +
                '        }\n' +
                '        }\n' +
                '        var createInvoiceButton = document.getElementById("createinvoice");\n' +
                '           if (createInvoiceButton) {' +
                '                createInvoiceButton.addEventListener("click", createInvoiceButtonClick);' +
                '           } else {' +
                '                console.log("createInvoiceButton button element not found.");' +
                '           }' +
                '        </script>',

            estimate: {
                id: 'estimate',
                fields: {
                    macAccount: {
                        id: 'custbody_adap_atl_mac_account'
                    }
                }
            },
            endUserAddress: {
                custbody_adap_enduser_name: 'addressee',
                custbodyadap_enduser_address1: 'addr1',
                custbody_enduser_address2: 'addr2',
                custbody_adap_enduser_city: 'city',
                custbody_adap_enduser_state: 'state',
                custbody_adap_enduser_zip: 'zip',
                custbody_adap_enduser_country: 'country',
            },
            defaultBillAddress: {
                addressee: 'addressee',
                addr1: 'addr1',
                addr2: 'addr2',
                city: 'city',
                state: 'state',
                zip: 'zip',
                country: 'country',
                billaddress: 'addressbookaddress'
            },
            defaultShipAddress: {
                addressee: 'addressee',
                addr1: 'addr1',
                addr2: 'addr2',
                city: 'city',
                state: 'state',
                zip: 'zip',
                country: 'country',
                shipaddress: 'addressbookaddress'
            },
            addressSubRecord: ['billingaddress', 'shippingaddress'],
            atlassianButtons:['custpage_atlassian_cart','custpage_refresh_quote','custpage_atlassian_generate_quotemr','custpage_get_atlassian_quote']
        }
        return objMapper
    });