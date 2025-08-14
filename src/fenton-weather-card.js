import { LitElement, html, css } from 'lit';
import './fenton-weather-card-editor.js';

// (This registration makes it show up in the add-card picker.)
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'fenton-weather-card',
  name: 'Fenton Weather Card',
  description: 'A compact weather card with wind, gradient, and warning alert.',
});

const G_DAY     = 'linear-gradient(0deg, #0448c7, #4886fa)';
const G_NIGHT   = 'linear-gradient(0deg, #122447, black)';
const G_CLOUDY  = 'linear-gradient(0deg, #2e4063, #505f7d)';

class FentonWeatherCard extends LitElement {
  static get properties() {
    return {
      hass: Object,
      config: Object,
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        border-radius: 8px;
        overflow: hidden;
      }
      .card {
        padding: 16px;
        color: white;
        position: relative;
        background: var(--weather-bg);
        font-family: inherit;
      }
      .card-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .icon {
        width: 100px;
        height: 100px;
        object-fit: contain;
        margin-right: 10px;
        flex-shrink: 0;
        display: block;
      }
      .main-info {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        margin-right: 24px;
      }
      .temp {
        font-size: 2.6rem;
        font-weight: bold;
        line-height: 1.1;
      }
      .condition {
        font-size: 1.1rem;
        opacity: 0.85;
        text-transform: capitalize;
      }
      .side-info {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 8px;
        margin-left: auto;
        min-width: 60px;
      }
      .side-value {
        font-size: 1.2rem;
      }
      .row {
        display: flex;
        justify-content: flex-end;
        margin-top: 10px;
        font-size: 1.1rem;
      }
      .warn {
        position: absolute;
        top: 8px; right: 8px;
        color: #ff3d3d;
        font-size: 30px;
        filter: drop-shadow(0 0 3px #000);
      }
    `;
  }

  setConfig(config) {
    const req = [
      'weather_entity', 'feels_like_entity', 'precipitation_entity',
      'wind_speed_entity', 'wind_gust_entity', 'warning_entity'
    ];
    for (const k of req) if (!config[k]) throw new Error(`Missing required: ${k}`);
    this.config = config;
  }

  getCardSize() { return 3; }

  format(val) {
    const num = Number(val);
    if (isNaN(num)) return val;
    return Math.round(num * 10) / 10;
  }

  render() {
    if (!this.hass || !this.config) return html``;
    const w = this.hass.states[this.config.weather_entity];
    if (!w) return html`<div class="card">Weather entity not found</div>`;

    let bg = G_DAY;
    const st = w.state.toLowerCase();
    if (st.includes('cloud')) bg = G_CLOUDY;
    else if (this.hass.states['sun.sun']?.state === 'below_horizon') bg = G_NIGHT;
    this.style.setProperty('--weather-bg', bg);

    // values
    const feels   = this.format(this._get(this.config.feels_like_entity));
    const precip  = this.format(this._get(this.config.precipitation_entity));
    const wind    = this.format(this._get(this.config.wind_speed_entity));
    const gust    = this.format(this._get(this.config.wind_gust_entity));
    const warnSt  = this.hass.states[this.config.warning_entity]?.state;
    const warn    = warnSt === 'on' || warnSt === 'warning';
    const tempVal = this.format(w.attributes.temperature);
    const tempUnit = "°"; // Always report °
    const precipUnit = w.attributes.precipitation_unit || '';
    const windUnit = w.attributes.wind_speed_unit || '';

    return html`
      <div class="card">
        ${warn ? html`<ha-icon class="warn" icon="mdi:alert-circle"></ha-icon>` : ''}
        <div class="card-top">
          <img class="icon"
            src="/local/weather_icons/animated/${w.state}.svg"
            alt="${w.state}">
          <div class="main-info">
            <div class="temp">${tempVal}${tempUnit}</div>
            <div class="condition">${w.state}</div>
          </div>
          <div class="side-info">
            <div class="side-value">${feels}${tempUnit}</div>
            <div class="side-value">${precip}${precipUnit}</div>
          </div>
        </div>
        <div class="row">
          <div>
            ${wind}/${gust} ${windUnit}
          </div>
        </div>
      </div>
    `;
  }

  _get(id) { const s = this.hass.states?.[id]; return s ? s.state : '—'; }
}
customElements.define('fenton-weather-card', FentonWeatherCard);