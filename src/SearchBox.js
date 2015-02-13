/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 搜索框控件
 * @author otakustay
 */
define(
    function (require) {
        var lib = require('./lib');
        var ui = require('esui');
        var Control = require('./Control');

        require('./TextBox');
        require('./Button');

        /**
         * 搜索框控件，由一个文本框和一个搜索按钮组成
         *
         * @extends Control
         * @param {Object} [options] 初始化参数
         * @constructor
         */
        function SearchBox(options) {
            Control.apply(this, arguments);
        }

        SearchBox.prototype.type = 'SearchBox';

        /**
         * 初始化参数
         *
         * @param {Object} [options] 构造函数传入的参数
         * @protected
         * @override
         */
        SearchBox.prototype.initOptions = function (options) {
            var properties = {
                // 搜索模式：`instant`、`normal`
                searchMode: 'normal',
                // 是否是最小化的，默认的样式是仅显示放大镜
                minimized: false
            };
            lib.extend(properties, options);

            if (properties.disabled === 'false') {
                properties.disabled = false;
            }

            if (properties.minimized === 'false') {
                properties.minimized = false;
            }

            if (lib.isInput(this.main)) {
                if (!properties.placeholder) {
                    properties.placeholder =
                        lib.getAttribute(this.main, 'placeholder');
                }

                if (!properties.text) {
                    properties.text = this.main.value;
                }

                if (!properties.maxLength && ( lib.hasAttribute(this.main, 'maxlength') || this.main.maxLength > 0)) {
                    properties.maxLength = this.main.maxLength;
                }
            }
            //TODO: custom elments 的兼容
            else {
                if (!properties.text) {
                    properties.text = lib.getText(this.main);
                }
            }

            if (!properties.title) {
                properties.title = this.main.title;
            }

            Control.prototype.initOptions.call(this, properties);
        };

        /**
         * 初始化DOM结构
         *
         * @protected
         * @override
         */
        SearchBox.prototype.initStructure = function () {
            var tpl = ''
                + '<div data-ui-mode="text" data-ui-childName="text" data-ui-height=${height}'
                +     'data-ui-type="TextBox" data-ui-placeholder=${this.placeholder}'
                +     'data-ui-icon="' + (this.mode === 'instant' ? 'icon ui-icon-search' : '') + '">'
                + '</div>'
                + '<span data-ui="childName:clear;type:Button;" class="${clearClasses}"></span>';

            // 正常模式下放大镜放到输入框后
            if (this.mode === 'normal') {
                tpl += '<span data-ui="childName:search;type:Button;" class="${searchClasses}">搜索</span>';
            }

            var html = lib.format(
                tpl,
                {
                    height: this.height,
                    clearClasses: this.helper.getPartClassName('clear'),
                    searchClasses: this.helper.getPartClassName('search')
                }
            );

            if (lib.isInput(this.main)) {
                this.helper.replaceMain();
            }

            this.main.innerHTML = html;
            this.helper.initChildren(this.main);
        };

        /**
         * 初始化事件交互
         *
         * @protected
         * @override
         */
        SearchBox.prototype.initEvents = function () {
            var textbox = this.getChild('text');
            var delegate = require('mini-event').delegate;

            // 即时模式下将input事件代理为search事件
            var inputEventType = this.mode === 'instant' ? 'input' : 'search';
            delegate(textbox, 'input', this, inputEventType);
            delegate(textbox, 'enter', this, 'search');
            // 回车时要取消掉默认行为，否则会把所在的表单给提交了
            textbox.on(
                'keypress',
                function (e) {
                    if (e.keyCode === 13) {
                        e.preventDefault();
                    }
                }
            );
            // textbox.on('focus', focus, this);
            // textbox.on('blur', lib.bind(this.removeState, this, 'focus'));

            var searchButton = this.getChild('search');
            delegate(searchButton, 'click', this, 'search');
        };

        function focus() {
            this.removeState('clear');
            this.addState('focus');
        }

        function click() {
            this.fire('search');
        }

        /**
         * 获取输入值
         *
         * @return {string}
         * @override
         */
        SearchBox.prototype.getValue = function () {
            var text = this.getChild('text');
            return text.getValue();
        };

        var paint = require('./painters');

        /**
         * 渲染自身
         *
         * @protected
         * @override
         */
        SearchBox.prototype.repaint = paint.createRepaint(
            Control.prototype.repaint,
            paint.attribute('title'),
            {
                name: [
                    'maxLength', 'placeholder', 'text',
                    'width', 'disabled', 'readOnly'
                ],
                paint: function (box, maxLength, placeholder, text, width, disabled, readOnly) {
                    var properties = {
                        /**
                         * @property {number} maxLength
                         *
                         * 最大长度，参考{@link TextBox#maxLength}
                         */
                        maxLength: maxLength,
                        /**
                         * @property {string} placeholder
                         *
                         * 无内容时的提示文字，参考{@link TextBox#placeholder}
                         */
                        placeholder: placeholder,
                        /**
                         * @property {string} text
                         *
                         * 文字内容
                         */
                        value: text,

                        /**
                         * @property {number} width
                         *
                         * 设定文本框宽度，参考{@link TextBox#width}
                         */
                        width: width,
                        disabled: disabled,
                        readOnly: readOnly
                    };
                    box.getChild('text').setProperties(properties);
                }
            },
            {
                name: 'disabled',
                paint: function (box, disabled) {
                    if (disabled === 'false') {
                        disabled = false;
                    }

                    var button = box.getChild('button');
                    button.set('disabled', disabled);
                }
            },
            {
                /**
                 * @property {boolean} fitWidth
                 *
                 * 设定当前控件是否独占一行宽度
                 */
                name: 'fitWidth',
                paint: function (box, fitWidth) {
                    var method = fitWidth ? 'addState' : 'removeState';
                    box[method]('fit-width');
                }
            }
        );

        /**
         * 获取用于比对的text属性值
         *
         * @return {string}
         * @protected
         */
        SearchBox.prototype.getTextProperty = function () {
            var textbox = this.getChild('text');
            return textbox ? textbox.getValue() : this.text;
        };

        lib.inherits(SearchBox, Control);
        ui.register(SearchBox);
        return SearchBox;
    }
);
