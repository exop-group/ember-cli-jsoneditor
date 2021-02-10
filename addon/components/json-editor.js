/* global JSONEditor */
import Component from '@ember/component';
import { run } from '@ember/runloop';
import { merge } from '@ember/polyfills';
import { isEmpty, isNone } from '@ember/utils';
// eslint-disable-next-line ember/no-observers
import { defineProperty, observer, computed } from '@ember/object';

const possibleOptions = ['ace', 'ajv', 'escapeUnicode', 'history', 'modes', 'search', 'indentation', 'theme', 'disabled'];

export default Component.extend({
  classNames: ['ember-cli-jsoneditor'],
  name: 'JSONEditor',
  mode: 'tree',
  history: true,
  search: true,
  indentation: 2,
  escapeUnicode: false,
  theme: 'ace/theme/jsoneditor',
  modes: null,
  disabled: false,
  isTyping: false,

  /**
   * Function to store JSON input value when changed
   *
   * @public
   * @property onChange
   * @type {Function}
   */
  onChange: null,

  /**
   *
   * @public
   * @property onError
   * @type {Function}
   */
  onError: null,

  /**
   *
   * @public
   * @property onModeChange
   * @type {Function}
   */
  onModeChange: function(newMode, oldMode) {
    this.set('mode', newMode);
  },

  /**
   *
   * @public
   * @property onEditable
   * @type {Function}
   */
  onEditable(e) {
    return e;
  },

  /**
   *
   * @public
   * @property onBlur
   * @type {Function}
   */
  onBlur() {
    this.isTyping = false;
  },

  init(...args) {
    this._super(...args);
    this.set('modes', ['tree', 'view', 'form', 'text', 'code']);
    defineProperty(this, 'options', computed(...possibleOptions, this.getOptions));
  },

  didInsertElement(...args) {
    this._super(...args);
    // eslint-disable-next-line no-underscore-dangle
    this._createEditorPid = run.scheduleOnce('afterRender', this, this.createEditor);
  },

  destroy(...args) {
    this._super(...args);
    if (!isNone(this.editor)) {
      this.editor.destroy();
    }
    // eslint-disable-next-line no-underscore-dangle
    run.cancel(this._createEditorPid);
  },

  // eslint-disable-next-line ember/no-observers
  createEditor: observer('options', function () {
    if (this.isDestroyed) {
      return;
    }
    if (isNone(this.element)) {
      return;
    }
    if (!isNone(this.editor)) {
      this.editor.destroy();
    }
    this.set('editor', new JSONEditor(this.element, this.options, this.getJSON()));
  }),

  // eslint-disable-next-line ember/no-observers
  modeChanged: observer('mode', function () {
    if (!this.isDestroyed) {
      this.editor.setMode(this.mode);
    }
  }),

  // eslint-disable-next-line ember/no-observers
  nameChanged: observer('name', function () {
    if (!this.isDestroyed) {
      this.editor.setName(this.name);
    }
  }),

  // eslint-disable-next-line ember/no-observers
  schemaChanged: observer('schema', function () {
    if (!this.isDestroyed) {
      this.editor.setSchema(this.schema);
    }
  }),

  // eslint-disable-next-line ember/no-observers
  jsonChanged: observer('json', function () {
    this.setJSON();
  }),

  getOptions() {
    const options = this.getProperties(possibleOptions);
    // eslint-disable-next-line ember/no-get
    merge(options, this.getProperties(['name', 'mode', 'schema']));
    if (options.disabled) {
      options.mode = 'view';
      options.modes = ['view'];
    }
    options.onChange = () => {
      this.isTyping = true;
      const { editor } = this;
      try {
        this.onChange(editor.get());
      } catch (err) {
        if (isEmpty(editor.getText())) {
          this.onChange({});
        }
      }
    };
    options.onBlur = this.onBlur.bind(this);
    options.onEditable = this.onEditable;
    options.onError = this.onError;
    options.onModeChange = this.onModeChange.bind(this);
    delete options.disabled;
    return options;
  },

  getJSON() {
    const { json } = this;
    if (typeof json === 'string') {
      return JSON.parse(json);
    }
    return json;
  },

  setJSON() {
    // Only update json if it was change programatically
    if (!this.isTyping && !this.isDestroyed) {
      this.editor.set(this.getJSON());
    }
  },
});
