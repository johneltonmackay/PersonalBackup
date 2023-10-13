/**
 * @NApiVersion 2.1
 */
define(['N/file', '../Library/handlebars.js'],
    /**
     * @param{file} file
     */
    (file, libHandleBars) => {

        let modHandleBars = {};


        modHandleBars.getResponse = (options) => {

            // log.debug('templateContent',options.templateContent);
            // log.debug(' options.data', options.data);
            return compileToHandlebar({
                data: options.data,
                template: options.templateContent,
                type: "json"
            });


        }



        modHandleBars.getFileContent = (prmFileId) => {
            //log.debug('prmFileId',prmFileId);
            let templateFile = '';
            if (prmFileId) {
                templateFile = file.load({
                    id: prmFileId
                }).getContents();

                /* templateFile = file.load({
                     id: "SuiteScripts/[SR] Customisations/Board Pack Report Customization/Library/Html/ema_temp_summary.html"
                 });*/
                // var templateString = templateFile.getContents();

            }
            return templateFile;
        }

        function compileToHandlebar(options) {
            let data = options.data;
            let strTemplate = options.template;
            let strType = options.type;

            libHandleBars.registerHelper('numberFormat', function (value, options) {
                // Helper parameters
                var dl = options.hash['decimalLength'] || 2;
                var ts = options.hash['thousandsSep'] || ',';
                var ds = options.hash['decimalSep'] || '.';

                // Parse to float
                var value = parseFloat(value);
              //  isNaN(value)?value = 0: value = value

                // The regex
                var re = '\\d(?=(\\d{3})+' + (dl > 0 ? '\\D' : '$') + ')';

                // Formats the number with the decimals
                var num = value.toFixed(Math.max(0, ~~dl));

                // Returns the formatted number
                return (ds ? num.replace('.', ds) : num).replace(new RegExp(re, 'g'), '$&' + ts);
            });

            libHandleBars.registerHelper('ifnoteq', function (a, b, options) {
                if (a != b) {
                    return options.fn(this);
                }
                return options.inverse(this);
            });

            libHandleBars.registerHelper('ifeq', function (a, b, options) {
                if (a == b) {
                    return options.fn(this);
                }
                return options.inverse(this);
            });

            libHandleBars.registerHelper('notPeriod', function (value) {
                return (value != "postingPeriodName") ? true : false;
            });


            var hbTemplate = libHandleBars.compile(strTemplate);

            if (strType == 'object') {
                var objNewData = {
                    dataObj: data
                };
                libHandleBars.registerHelper('json', function (context) {
                    return JSON.stringify(objNewData);
                });
                return hbTemplate(data);
            }
            if (strType == 'array') {
                libHandleBars.registerHelper('json', function (context) {
                    return JSON.stringify(data);
                });
                return hbTemplate(data);
            } else {
                libHandleBars.registerHelper("bold", function (text) {
                    var result = "<b>" + libHandleBars.escapeExpression(text) + "</b>";
                    return new libHandleBars.SafeString(result);
                });

                return hbTemplate(data);
            }
        }

        return modHandleBars;
    });
