import { LitElement, html, css } from 'lit';
import './fenton-weather-card-editor.js';

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'fenton-weather-card',
  name: 'Fenton Weather Card',
  description: 'Compact weather card with wind, gradient, alerts, icons',
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
        padding: 3px 12px 6px 12px;
        color: white;
        position: relative;
        background: var(--weather-bg);
        font-family: inherit;
      }
      .card-top {
        display: flex;
        align-items: flex-start;
        margin-bottom: 2px;
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
        margin-right: 16px;
        margin-top: 7px;
      }
      .temp {
        font-size: 1.7rem;
        font-weight: 400;
        line-height: 1.03;
        margin-bottom: 2.5px;
      }
      .condition {
        font-size: 1.5rem;
        font-weight: 700;
        opacity: 0.93;
        text-transform: capitalize;
        line-height: 1.14;
      }
      .side-info {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 8px;
        margin-left: auto;
        min-width: 65px;
        margin-top: 10px;
      }
      .side-value {
        font-size: 1.10rem;
        line-height: 1.1;
        display: flex;
        align-items: center;
        gap: 5px;
      }
      .raindrop {
        --mdc-icon-size: 18px;
        height: 18px;
        width: 18px !important;
        margin-right: 1.5px;
        color: #8ecae6;
        vertical-align: bottom;
      }
      .warn {
        position: absolute;
        top: 4px; right: 7px;
        color: #ff3d3d;
        font-size: 26px;
        filter: drop-shadow(0 0 3px #222);
      }

      .bottom-section {
        margin-top: 0.05em;
      }
      .bottom-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        width: 100%;
        margin-top: 5px;
      }
      .bottom-col {
        display: flex;
        align-items: flex-start;
        flex: 1 1 0px;
        min-width: 0;
        gap: 5px;
      }
      .bottom-iconwrap {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        height: 34px;
        min-width: 28px;
      }
      .bottom-iconwrap ha-icon {
        --mdc-icon-size: 23px;
        height: 23px;
        width: 23px !important;
        color: #eaeaea;
        filter: drop-shadow(0 0 2px #2224);
      }
      .bottom-labelval {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        flex: 1 1 0px;
      }
      .bottom-label {
        font-size: 0.80rem;
        font-weight: 500;
        opacity: 0.82;
        margin-bottom: 0px;
        letter-spacing: 0.02em;
        line-height: 1.08;
        color: #eaeaea;
      }
      .bottom-value {
        font-size: 1.07rem;
        font-weight: 400;
        color: #fff;
        opacity: 0.83;
        line-height: 1.26;
      }
      @media(max-width: 420px) {
        .icon { width: 65px; height: 65px; }
        .temp { font-size: 1.15rem; }
        .condition { font-size: 0.98rem; }
        .side-value { font-size: 0.89rem; }
        .bottom-label, .bottom-value { font-size: 0.76rem; }
        .bottom-col .bottom-labelval { max-width: 56vw; }
        .bottom-iconwrap ha-icon { --mdc-icon-size: 17px; height: 17px; }
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
    return num.toFixed(decimals);
  }

  formatInt(val) {
    const num = Number(val);
    if (isNaN(num)) return val;
    return Math.round(num);
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
    const wind    = this.formatInt(this._get(this.config.wind_speed_entity));
    const gust    = this.formatInt(this._get(this.config.wind_gust_entity));
    const warnSt  = this.hass.states[this.config.warning_entity]?.state;
    const warn    = warnSt === 'on' || warnSt === 'warning';
    const tempVal = this.format(w.attributes.temperature);
    const tempUnit = "°";
    const precipUnit = w.attributes.precipitation_unit || '';
    const windUnit = "mph";

    // Bottom row: Sunrise/Sunset/Wind
    const sunEnt = this.hass.states['sun.sun'];
    const sunrise = sunEnt ? this._localTime(sunEnt.attributes.next_rising) : '--';
    const sunset = sunEnt ? this._localTime(sunEnt.attributes.next_setting) : '--';

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
            <div class="side-value">
              <ha-icon class="raindrop" icon="mdi:weather-rainy"></ha-icon>
              ${precip}${precipUnit}
            </div>
          </div>
        </div>
        <!-- Bottom Row: Three columns with icon | label (above) | value (below) -->
        <div class="bottom-section">
          <div class="bottom-row">
            <!-- Sunrise -->
            <div class="bottom-col">
              <span class="bottom-iconwrap">
                <ha-icon icon="mdi:weather-sunset-up"></ha-icon>
              </span>
              <span class="bottom-labelval">
                <span class="bottom-label">Sunrise</span>
                <span class="bottom-value">${sunrise}</span>
              </span>
            </div>
            <!-- Sunset -->
            <div class="bottom-col">
              <span class="bottom-iconwrap">
                <ha-icon icon="mdi:weather-sunset-down"></ha-icon>
              </span>
              <span class="bottom-labelval">
                <span class="bottom-label">Sunset</span>
                <span class="bottom-value">${sunset}</span>
              </span>
            </div>
            <!-- Wind -->
            <div class="bottom-col">
              <span class="bottom-iconwrap">
                <ha-icon icon="mdi:weather-windy"></ha-icon>
              </span>
              <span class="bottom-labelval">
                <span class="bottom-label">Wind Speed</span>
                <span class="bottom-value">${wind}-${gust} ${windUnit}</span>
              </span>
            </div>
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
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
}
customElements.define('fenton-weather-card', FentonWeatherCard);