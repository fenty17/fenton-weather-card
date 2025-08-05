import { LitElement, html, css } from 'lit';

class FentonWeatherCardEditor extends LitElement {
  static get properties() {
    return {
      hass:   Object,
      config: Object
    };
  }
  static get styles() {
    return css`
      .card-config { padding: 16px; }
      ha-form { width: 100%; }
    `;
  }

  setConfig(config) {
    this.config = config;
  }

  render() {
    if (!this.hass || !this.config) return html``;

    const schema = [
      { name: 'weather_entity',        selector: { entity: { domain: 'weather' } }},
      { name: 'feels_like_entity',     selector: { entity: { domain: 'sensor'  } }},
      { name: 'precipitation_entity',  selector: { entity: { domain: 'sensor'  } }},
      { name: 'wind_speed_entity',     selector: { entity: { domain: 'sensor'  } }},
      { name: 'wind_gust_entity',      selector: { entity: { domain: 'sensor'  } }},
      { name: 'warning_entity',        selector: { entity: { domain: 'binary_sensor' } }},
    ];

    return html`
      <div class="card-config">
        <ha-form
          .hass="${this.hass}"
          .data="${this.config}"
          .schema="${schema}"
          @value-changed="${e => this._valueChanged(e.detail.value)}">
        </ha-form>
      </div>
    `;
  }

  _valueChanged(value) {
    this.config = { ...this.config, ...value };
    this.dispatchEvent(new Event('config-changed', { bubbles: true, composed: true }));
  }
}

customElements.define('fenton-weather-card-editor', FentonWeatherCardEditor);
