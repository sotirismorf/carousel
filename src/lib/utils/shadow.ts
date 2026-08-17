/**
 * Drop shadow for "normal" mode images — mostly book and periodical covers.
 *
 * Modelled as a single overhead-front light: one large diffuse shadow plus one tight contact
 * shadow that keeps the cover reading as sitting *in front of* the background rather than
 * floating above it. Raising softness widens the blur while lowering the offset and opacity,
 * which is how a larger, more diffuse light source actually behaves.
 *
 * `box-shadow` casts the element's rectangle, which is correct for opaque rectangular covers.
 * A transparent-cutout PNG would need `filter: drop-shadow()` instead; that is deliberately
 * not supported (it is slower and creates a containing block).
 *
 * @param size      Base-px shadow size, 0 disables.
 * @param softness  0-100.
 * @param gs        Geometry scale (1 in preview, exportScale in export).
 */
export function imageShadowCss(size: number, softness: number, gs: number): string {
	if (size <= 0) return 'none';

	const s = size;
	const f = Math.min(Math.max(softness, 0), 100) / 100;

	const blur1 = s * (0.35 + 1.15 * f);
	const y1 = s * (0.55 - 0.25 * f);
	const a1 = 0.3 * (1 - 0.45 * f);

	const blur2 = blur1 * 0.3;
	const y2 = y1 * 0.25;
	const a2 = 0.22 * (1 - 0.3 * f);

	const px = (v: number) => `${(v * gs).toFixed(2)}px`;

	// The negative spread on the large shadow stops it haloing above the top edge.
	return (
		`0 ${px(y1)} ${px(blur1)} ${px(-s * 0.15)} rgba(0,0,0,${a1.toFixed(3)}), ` +
		`0 ${px(y2)} ${px(blur2)} 0 rgba(0,0,0,${a2.toFixed(3)})`
	);
}
