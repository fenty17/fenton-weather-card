import { LitElement, html, css } from 'lit';
import './fenton-weather-card-editor.js';

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'fenton-weather-card',
  name: 'Fenton Weather Card',
  description: 'Compact weather card with wind, gradient, and alert',
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
        padding: 6px 14px;
        color: white;
        position: relative;
        background: var(--weather-bg);
        font-family: inherit;
      }
      .card-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 4px;
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
        margin-right: 20px;
      }
      .temp {
        font-size: 2.1rem;
        font-weight: 400;
        line-height: 1.08;
        margin-bottom: 3px;
      }
      .condition {
        font-size: 1.4rem;
        font-weight: 700;
        opacity: 0.91;
        text-transform: capitalize;
        line-height: 1.18;
      }
      .side-info {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 8px;
        margin-left: auto;
        min-width: 65px;
      }
      .side-value {
        font-size: 1.10rem;
        line-height: 1.22;
      }
      .warn {
        position: absolute;
        top: 6px; right: 7px;
        color: #ff3d3d;
        font-size: 28px;
        filter: drop-shadow(0 0 3px #000);
      }
      .bottom-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 0.4em;
        margin-bottom: 0.2em;
      }
      .bottom-item {
        display: flex;
        align-items: center;
        gap: 5px;
        flex: 1 1 0px;
        min-width: 0;
        font-size: 1.09rem;
        justify-content: center;
      }
      ha-icon {
        --mdc-icon-size: 25px;
        height: 25px;
        width: 25px !important;
        color: white;
      }
      @media(max-width: 420px) {
        .icon { width: 65px; height: 65px; }
        .temp { font-size: 1.3rem; }
        .condition { font-size: 1.0rem; }
        .side-value { font-size: 0.95rem; }
        ha-icon { --mdc-icon-size: 20px; height: 20px; }
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

  getCardSize() { return 2; }

  format(val, decimals=1) {
    const num = Number(val);
    if (isNaN(num)) return val;
    // Clamp: don't style - unknown or unavailable
    return num.toFixed(decimals);
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

    const feels   = this.format(this._get(this.config.feels_like_entity));
    const precip  = this.format(this._get(this.config.precipitation_entity), 2);
    const wind    = this.format(this._get(this.config.wind_speed_entity));
    const gust    = this.format(this._get(this.config.wind_gust_entity));
    const warnSt  = this.hass.states[this.config.warning_entity]?.state;
    const warn    = warnSt === 'on' || warnSt === 'warning';
    const tempVal = this.format(w.attributes.temperature);
    const tempUnit = "°";
    const precipUnit = w.attributes.precipitation_unit || '';
    // wind mph always
    const windUnit = "mph";

    // Bottom row: Sunrise/Sunset/Wind
    const sunEnt = this.hass.states['sun.sun'];
    const sunrise = sunEnt ? this._localTime(sunEnt.attributes.next_rising) : '--';
    const sunset = sunEnt ? this._localTime(sunEnt.attributes.next_setting) : '--';
    const windDisplay = `${wind}-${gust} ${windUnit}`;

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
        <div class="bottom-row">
          <div class="bottom-item">
            <ha-icon icon="mdi:weather-sunset-up"></ha-icon>
            <span>${sunrise}</span>
          </div>
          <div class="bottom-item">
            <ha-icon icon="mdi:weather-sunset-down"></ha-icon>
            <span>${sunset}</span>
          </div>
          <div class="bottom-item">
            <ha-icon icon="mdi:weather-windy"></ha-icon>
            <span>${windDisplay}</span>
          </div>
        </div>
      </div>
    `;
  }

  _get(id) {
    const s = this.hass.states?.[id];
    return s ? s.state : '—';
  }

  _localTime(isoStr) {
    if (!isoStr) return '--';
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return '--';
    // Format as e.g. 7:48 AM, omit seconds
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
}
customElements.define('fenton-weather-card', FentonWeatherCard);