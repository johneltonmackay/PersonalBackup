/**
 * @NApiVersion 2.1
 */
define([],

    () => {
        const INT_DEFAULT_VENDOR = 2120;
        const INT_ATLASIAN_FORM = 148;
        const INT_USD_CURRENCY = 5;
        const STR_CREATE_PO_SL_LINK = '"https://8190294-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=customscript_sl_create_po&deploy=customdeploy_sl_create_po&invoiceId=';
        const objMapping = {}
        objMapping.invEmailTemplate = 5
        objMapping.sendEmailCreatePOSL = '/app/site/hosting/scriptlet.nl?script=customscript_sl_create_po&deploy=customdeploy_sl_create_po&invoiceId='
        objMapping.invoiceForm = 149
        objMapping.existingPOQuery = '../SQL/adap_check_existing_po.sql'

        objMapping.headerField = {
            customform: INT_ATLASIAN_FORM,
            entity: INT_DEFAULT_VENDOR,
            currency: INT_USD_CURRENCY
        }


        objMapping.lineField = {
            custrecord_adap_atl_product: 'item',
            custrecord_adap_atl_cart_parent: 'custcol_adap_atlassian_cart_holder',
            id: 'custcol_adap_atl_cart_item',
            custrecord_adap_cart_item_desc: 'description',
            custrecord_adap_atl_avst_total: 'rate' // to verify with Dean

        }
        objMapping.inlineEventListener = ' <script>' +
            '  function handleEmailButtonClick() {' +
            '  var invoiceId = document.getElementById("id");' +
            '  if (invoiceId) {' +
            '  console.log(invoiceId.value);' +
            '  let intId = invoiceId.value;' +
            '  var strNewUrl=' + STR_CREATE_PO_SL_LINK +'{{intId}}'+'";' +
            '  console.log(strNewUrl);' +
            '  window.location.href = strNewUrl;' +
            '} else {' +
            '  console.log("Checkbox element not found.");' +
            '}' +
            '}' +
            '   var emailButton = document.getElementById("email");' +
            '  if (emailButton) {' +
            ' emailButton.addEventListener("click", handleEmailButtonClick);' +
            '} else {' +
            'console.log("Email button element not found.");' +
            '}' +
            '</script>'

        return {objMapping}

    });
