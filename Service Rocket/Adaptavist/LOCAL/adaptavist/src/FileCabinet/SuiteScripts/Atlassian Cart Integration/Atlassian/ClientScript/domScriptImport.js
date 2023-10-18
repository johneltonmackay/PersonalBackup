/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(['N/query', '../../Library/FieldAndValueMapper/adap_field_and_def_value_mapper.js'], (query, mapper) => {
    pageInit = () => {
    }

    (function importFooterScript() {
        if (!window.location.href.includes('getRefreshQuote')) {
            const sSql = `SELECT * from file where folder = ${mapper.SUITELET_JS_DOM_LIB} AND filetype ='JAVASCRIPT'`;
            const arrImports = query.runSuiteQL({
                query: sSql
            }).asMappedResults();
            var intTimeStamp = new Date().getTime()
            for (const jsImport of arrImports) {
                var js = document.createElement('script');
                js.setAttribute('src', jsImport.url + '&fcts=' + intTimeStamp);
                document.head.appendChild(js);
            }
        }
    })();

    return {
        pageInit
    };

});
