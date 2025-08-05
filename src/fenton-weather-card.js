import { LitElement, html, css } from 'lit';
import './fenton-weather-card-editor.js';

//
// Tell Lovelace about your card (so “Add Card” shows it):
//
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'fenton-weather-card',
  name: 'Fenton Weather Card',
  description: 'Compact weather card with gradients, wind, alerts',
});

const G_DAY     = 'linear-gradient(0deg, #0448c7, #4886fa)';
const G_NIGHT   = 'linear-gradient(0deg, #122447, black)';
const G_CLOUDY  = 'linear-gradient(0deg, #2e4063, #505f7d)';
// you can extend: rain, snow…

class MyWeatherCard extends LitElement {
  static get properties() {
    return {
      hass:    Object,
      config:  Object
    };
  }
  static get styles() {
    return css`
      :host { display: block; border-radius: 8px; overflow: hidden; }
      .card { padding: 12px; color: white; position: relative; background: var(--weather-bg); font-family: sans-serif; }
      .icon { width: 80px; height: 80px; }
      .warn { position: absolute; top: 8px; right: 8px; color: red; font-size: 32px; }
      .row { display: flex; justify-content: space-between; margin-top: 8px; }
      .item { text-align: center; }
      .label { font-size: 0.75rem; opacity: 0.8; }
      .value { font-size: 1.3rem; font-weight: bold; }
    `;
  }

  setConfig(config) {
    const req = [
      'weather_entity',
      'feels_like_entity',
      'precipitation_entity',
      'wind_speed_entity',
      'wind_gust_entity',
      'warning_entity'
    ];
    for (const k of req) {
      if (!config[k]) {
        throw new Error(`Missing required configuration: ${k}`);
      }
    }
    this.config = config;
  }

  getCardSize() {
    return 3;
  }

  render() {
    if (!this.hass || !this.config) return html``;
    const w   = this.hass.states[this.config.weather_entity];
    if (!w) return html`<div class="card">Weather entity not found</div>`;

    // choose gradient
    let bg = G_DAY;
    const st = w.state.toLowerCase();
    if (st.includes('cloud'))        bg = G_CLOUDY;
    else if (this.hass.states['sun.sun'].state === 'below_horizon') bg = G_NIGHT;
    this.style.setProperty('--weather-bg', bg);

    // read sensors
    const feels = this._read(this.config.feels_like_entity);
    const precip= this._read(this.config.precipitation_entity);
    const wind  = this._read(this.config.wind_speed_entity);
    const gust  = this._read(this.config.wind_gust_entity);
    const warnS = this.hass.states[this.config.warning_entity]?.state;
    const warn  = (warnS === 'on' || warnS === 'warning');

    return html`
      <div class="card">
        ${warn ? html`<div class="warn"><ha-icon icon="mdi:alert-circle"></ha-icon></div>` : ''}
        <img class="icon"
             src="/local/weather_icons/animated/${w.state}.svg"
             alt="${w.state}">
        <div class="row">
          <div class="item">
            <div class="label">Temp</div>
            <div class="value">${w.attributes.temperature}°</div>
          </div>
          <div class="item">
            <div class="label">Feels like</div>
            <div class="value">${feels}°</div>
          </div>
        </div>
        <div class="row">
          <div class="item">
            <div class="label">Precip</div>
            <div class="value">${precip}${w.attributes.precipitation_unit||''}</div>
          </div>
          <div class="item">
            <div class="label">Wind</div>
            <div class="value">${wind}/${gust} ${w.attributes.wind_speed_unit}</div>
          </div>
        </div>
      </div>
    `;
  }

  _read(id) {
    const s = this.hass.states[id];
    return s ? s.state : '–';
  }
}

customElements.define('fenton-weather-card', MyWeatherCard);
