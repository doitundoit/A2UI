/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import { html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { v0_8 } from "@a2ui/lit";

// Get API key from environment (Vite injects this at build time)
const GOOGLE_API_KEY = (import.meta as any).env?.VITE_GOOGLE_API_KEY || "";

// Local placeholder image path (served from public directory)
const LOCAL_PLACEHOLDER_IMAGE = "/map-placeholder.png";

interface LatLng {
  lat: number;
  lng: number;
}

interface MapPin {
  lat: number;
  lng: number;
  name?: string;
  description?: string;
  background?: string;
  borderColor?: string;
  glyphColor?: string;
}

interface PathValue {
  path: string;
}

@customElement("a2ui-custom-googlemap")
export class GoogleMap extends v0_8.UI.Root {
  @property({ attribute: false })
  accessor center: PathValue | LatLng | null = null;

  @property({ attribute: false })
  accessor zoom: PathValue | number | null = null;

  @property({ attribute: false })
  accessor pins: PathValue | MapPin[] | null = null;

  static styles = [
    css`
      :host {
        display: block;
        flex: var(--weight);
        min-height: 200px;
        overflow: hidden;
        border-radius: 8px;
      }

      .map-container {
        width: 100%;
        height: 100%;
        min-height: 300px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #e8e8e8;
        border-radius: 8px;
        overflow: hidden;
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .placeholder-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
        padding: 24px;
        text-align: center;
      }

      .placeholder-icon {
        font-size: 48px;
        color: #5f6368;
      }

      .placeholder-text {
        color: #5f6368;
        font-size: 14px;
      }

      .pin-list {
        margin-top: 8px;
        font-size: 12px;
        color: #80868b;
      }
    `,
  ];

  /**
   * Resolves a value that might be a path binding or a literal value.
   */
  private resolveValue<T>(value: PathValue | T | null): T | null {
    if (!value) return null;

    if (typeof value === "object" && "path" in value && value.path) {
      if (!this.processor || !this.component) {
        return null;
      }
      return this.processor.getData(
        this.component,
        value.path,
        this.surfaceId ?? v0_8.Data.A2uiMessageProcessor.DEFAULT_SURFACE_ID
      ) as T | null;
    }

    return value as T;
  }

  /**
   * Builds a Google Maps Static API URL from the resolved data.
   */
  private buildGoogleMapsUrl(
    center: LatLng,
    zoom: number,
    pins: MapPin[]
  ): string {
    const baseUrl = "https://maps.googleapis.com/maps/api/staticmap";
    const params = new URLSearchParams({
      center: `${center.lat},${center.lng}`,
      zoom: zoom.toString(),
      size: "600x400",
      scale: "2",
      key: GOOGLE_API_KEY,
    });

    // Add markers for each pin
    pins.forEach((pin, index) => {
      const label = pin.name?.charAt(0).toUpperCase() || String(index + 1);
      const color = pin.background?.replace("#", "") || "red";
      params.append("markers", `color:0x${color}|label:${label}|${pin.lat},${pin.lng}`);
    });

    return `${baseUrl}?${params.toString()}`;
  }

  render() {
    const resolvedCenter = this.resolveValue<LatLng>(this.center);
    const resolvedZoom = this.resolveValue<number>(this.zoom) ?? 11;
    const resolvedPins = this.resolveValue<MapPin[]>(this.pins) ?? [];

    // Decision logic: Use Google Maps if API key is available, otherwise use placeholder
    if (GOOGLE_API_KEY && resolvedCenter) {
      const mapUrl = this.buildGoogleMapsUrl(
        resolvedCenter,
        resolvedZoom,
        resolvedPins
      );
      return html`
        <div class="map-container">
          <img src=${mapUrl} alt="Map showing ${resolvedPins.length} locations" />
        </div>
      `;
    }

    // Fallback: Show local placeholder image with pin information
    return html`
      <div class="map-container">
        <div class="placeholder-container">
          <img src=${LOCAL_PLACEHOLDER_IMAGE} alt="Map placeholder" />
          ${resolvedPins.length > 0
            ? html`
                <div class="pin-list">
                  📍 ${resolvedPins.length} locations:
                  ${resolvedPins.map((pin) => pin.name).join(", ")}
                </div>
              `
            : nothing}
        </div>
      </div>
    `;
  }
}
