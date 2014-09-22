/**
 * Created with IntelliJ IDEA.
 * User: melo
 * Date: 21/10/13
 * Time: 16:19
 */
var nodemailer = require("nodemailer"),
    fs = require("fs"),
    _ = require("lodash"),
    Nodemailer = (function () {

        Nodemailer.prototype.transport = {};

        Nodemailer.prototype.i18n;

        Nodemailer.prototype.template;

        Nodemailer.prototype.attachments = [];

        function Nodemailer(transport, i18n) {
            var $this = this;
            $this.transport = transport;
            $this.i18n = i18n;
        }

        Nodemailer.prototype.setTemplate = function (templateName, callback) {
            var $this = this;
            fs.readFile("./public/views/email/" + templateName + ".html", 'utf-8', function (err, data) {
                if (!err) {
                    $this.template = data;
                }
                callback();
            });
        };

        Nodemailer.prototype.send = function (options, callback) {
            var $this = this;

            //-- Template not loaded --//
            if (typeof($this.template) !== "string") {
                throw new Error("Template not loaded.");
            }

            //-- Add data to template --//
            var data = {};
            if (options.data) {
                data = _.extend(data, options.data);
            }
            if ($this.i18n) {
                data = _.extend(data, {i18n: $this.i18n});
            }
            var html = _.template($this.template, data, {
                interpolate: /\{\{(.+?)\}\}/g
            });

            //-- Attachments --//
            var attachments = $this.getAttachments();

            //-- From --//
            var from = "";
            if (typeof(options.from) === "string") {
                from = options.from;
            } else {
                if (typeof(options.from.name) === "string") {
                    from = "'" + options.from.name + "' <" + options.from.email + ">";
                } else {
                    from = options.from.email;
                }
            }

            //-- To --//
            var to = "";
            if (typeof(options.to) === "string") {
                to = options.to;
            } else {
                if (typeof(options.to.name) === "string") {
                    to = "'" + options.to.name + "' <" + options.to.email + ">";
                } else {
                    to = options.to.email;
                }
            }

            //-- Create transport --//
            var transport = nodemailer.createTransport($this.transport.type, $this.transport.settings);
            return transport.sendMail({
                to: to,
                from: from,
                subject: options.subject,
                html: html,
                generateTextFromHTML: true,
                attachments: attachments
            }, callback);
        };

        Nodemailer.prototype.getAttachments = function () {
            var $this = this,
                id,
                attachments = [];
            for (id in this.attachments) {
                attachments.push(this.attachments[id]);
            }
            return attachments;
        };

        Nodemailer.prototype.addAttachments = function (cid,filename,path) {
            this.attachments.push({
                cid:cid,
                fileName:filename,
                filePath:path
            });
        };

        Nodemailer.prototype.removeAttachments = function (cid) {
            this.attachments[cid];
        };
        return Nodemailer;
    })();

exports.Nodemailer = module.exports.Nodemailer = Nodemailer;