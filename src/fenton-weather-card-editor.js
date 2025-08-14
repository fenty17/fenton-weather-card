import { LitElement, html, css } from 'lit';

class FentonWeatherCardEditor extends LitElement {
  static get properties() {
    return { hass: Object, config: Object };
  }
  setConfig(config) { this.config = config || {}; }
  get _schema() {
    return [
      {name: 'weather_entity', selector: {entity: {domain: 'weather'}}},
      {name: 'feels_like_entity', selector: {entity: {domain: 'sensor'}}},
      {name: 'precipitation_entity', selector: {entity: {domain: 'sensor'}}},
      {name: 'wind_speed_entity', selector: {entity: {domain: 'sensor'}}},
      {name: 'wind_gust_entity', selector: {entity: {domain: 'sensor'}}},
      {name: 'warning_entity', selector: {entity: {domain: 'binary_sensor'}}},
    ];
  }
  _valueChanged(e) {
    this.config = e.detail.value;
    this.dispatchEvent(new CustomEvent('config-changed', {detail: {config: this.config}}));
  }
  render() {
    if (!this.hass) return html``;
    // ha-form is part of Home Assistant, schema and data are passed as JS objects (not string).
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this.config}
        .schema=${this._schema}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }
}
customElements.define('fenton-weather-card-editor', FentonWeatherCardEditor);