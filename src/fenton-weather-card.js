import { LitElement, html, css } from 'lit';
import './fenton-weather-card-editor.js';

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'fenton-weather-card',
  name: 'Fenton Weather Card',
  description: 'Customizable compact weather card',
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
        width: 100%;
        gap: 0px;
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

      .icon-main-warning-wrap {
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        gap: 10px;
        min-width: 120px;
        position: relative;
      }

      .warn-triangle {
        color: #ff4343;
        font-size: 42px;
        margin-top: 3px;
        margin-left: 1px;
        filter: drop-shadow(0 0 2px #000);
        z-index: 2;
        cursor: pointer;
        flex-shrink: 0;
        /* No longer positioned absolute */
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
      .bottom-section {
        margin-top: 0.2em;
      }
      .bottom-row {
        display: flex;
        justify-content: center;
        align-items: flex-end;
        width: 100%;
        margin-top: 5px;
        gap: 60px; /* wider horizontal spacing between sensors */
      }
      .bottom-col {
        display: flex;
        align-items: flex-start;
        flex: 0 1 auto;
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
        .warn-triangle { font-size: 27px; }
        .card-top { gap: 0px; }
        .bottom-row { gap: 22px; }
        .icon-main-warning-wrap { min-width: 76px; }
      }
    `;
  }

  setConfig(config) {
    this.config = {
      static_icons: false,
      ...config
    };

    const req = [
      'weather_entity', 'feels_like_entity', 'precipitation_entity',
      'wind_speed_entity', 'wind_gust_entity'
    ];
    for (const k of req) if (!this.config[k]) throw new Error(`Missing required: ${k}`);
  }

  // Check for at least one entry in warning_sensor mentioning 'Shetland'
  hasShetlandWarning() {
    if (!this.config.warning_sensor) return false;
    const entity = this.hass.states?.[this.config.warning_sensor];
    if (!entity) return false;
    const entries = entity.attributes?.entries;
    if (!Array.isArray(entries)) return false;
    return entries.some(
      e => e && typeof e.summary === 'string' && e.summary.includes('Shetland')
    );
  }

  _onWarningClick() {
    if (this.config.warning_action_path) {
      history.pushState(null, '', this.config.warning_action_path);
      window.dispatchEvent(new Event('location-changed'));
    }
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

  _get(id) {
    const s = this.hass.states?.[id];
    return s ? s.state : '—';
  }

  // Degrees to compass point (8 or 16-point, here we'll use 16)
  degToCompass(deg) {
    if (deg === null || deg === undefined || deg === "") return "";
    let val = Number(deg);
    if (isNaN(val)) return deg;
    const dirs = [
      "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
      "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
    ];
    val = ((val % 360) + 360) % 360; // ensure 0..359
    const idx = Math.round(val / 22.5) % 16;
    return dirs[idx];
  }

  render() {
    if (!this.hass || !this.config) return html``;
    const w = this.hass.states[this.config.weather_entity];
    if (!w) return html`<div class="card">Weather entity not found</div>`;

    // Icon type
    const iconDir = this.config.static_icons ? 'static' : 'animated';

    // Card background
    let bg = G_DAY;
    const st = w.state.toLowerCase();
    if (st.includes('cloud')) bg = G_CLOUDY;
    else if (this.hass.states['sun.sun']?.state === 'below_horizon') bg = G_NIGHT;
    this.style.setProperty('--weather-bg', bg);

    // Values
    const feels   = this.format(this._get(this.config.feels_like_entity));
    const precip  = this.format(this._get(this.config.precipitation_entity), 2);
    const wind    = this.formatInt(this._get(this.config.wind_speed_entity));
    const gust    = this.formatInt(this._get(this.config.wind_gust_entity));
    const tempVal = this.format(w.attributes.temperature);
    const tempUnit = "°";
    const precipUnit = w.attributes.precipitation_unit || '';
    const windUnit = "mph";
    let windDirDisplay = "";
    if (this.config.wind_direction_entity) {
      const dirVal = this._get(this.config.wind_direction_entity);
      windDirDisplay = this.degToCompass(dirVal);
    }
    // Bottom row
    const sunEnt = this.hass.states['sun.sun'];
    const sunrise = sunEnt ? this._localTime(sunEnt.attributes.next_rising) : '--';
    const sunset = sunEnt ? this._localTime(sunEnt.attributes.next_setting) : '--';

    return html`
      <div class="card">
        <div class="card-top">
          <div class="icon-main-warning-wrap">
            <img class="icon"
              src="/local/weather_icons/${iconDir}/${w.state}.svg"
              alt="${w.state}">
            ${this.config.warning_sensor && this.hasShetlandWarning() ? html`
              <ha-icon
                class="warn-triangle"
                icon="mdi:alert"
                @click="${() => this._onWarningClick()}"
                title="Weather warning for Shetland"
                tabindex="0"
                style="cursor:pointer;">
              </ha-icon>
            ` : ""}
            <div class="main-info">
              <div class="temp">${tempVal}${tempUnit}</div>
              <div class="condition">${w.state}</div>
            </div>
          </div>
          <div class="side-info">
            <div class="side-value">${feels}${tempUnit}</div>
            <div class="side-value">
              <ha-icon class="raindrop" icon="mdi:weather-rainy"></ha-icon>
              ${precip}${precipUnit}
            </div>
          </div>
        </div>
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
                <span class="bottom-label"
                  >Wind${windDirDisplay ? ` (${windDirDisplay})` : ""}</span>
                <span class="bottom-value"
                  >${wind}-${gust} ${windUnit}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _localTime(isoStr) {
    if (!isoStr) return '--';
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return '--';
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
}
customElements.define('fenton-weather-card', FentonWeatherCard);