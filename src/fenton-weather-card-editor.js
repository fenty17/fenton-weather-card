import { LitElement, html } from 'lit';

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
      {name: 'wind_direction_entity', selector: {entity: {domain: 'sensor'}}},
      {name: "static_icons", selector: {boolean: {}}},
      {name: 'warning_sensor', selector: {entity: {}}},
      {name: 'warning_action_path', selector: {text: {}}},
    ];
  }
  _valueChanged(e) {
    this.config = e.detail.value;
    this.dispatchEvent(new CustomEvent('config-changed', {detail: {config: this.config}}));
  }
  render() {
    if (!this.hass) return html``;
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