// Ink (opt-in "set": { "ink": ... }, 8 Nov 2026): a fork of three.js r186 examples/jsm/effects/OutlineEffect.js (MIT,
// Copyright 2010-2026 three.js authors, https://github.com/mrdoob/three.js/blob/dev/LICENSE) with the line width in
// real pixels. three's hull pushes each vertex by a clip-space amount, so in our tall 9:16 frame a line came out about
// 3 px on the left and right of a body and 5.6 px on its top and bottom (research/anime-look-2026-11-07, item 5). Here
// the push is measured in screen pixels along the normal's on-screen direction, so a line is the same width on every
// side, and it thins with distance like a drawn line (the MEGA CLAWD ink pass, seeconever/megaclawd, MIT: width x
// (ref / depth)^0.3, clamped). A material's userData.outlineParameters.thickness is then a width in pixels at 1080 wide.
// The effect also takes a shared state object { res, ref, pow, min, max } that the caller updates before each render.
import {
	BackSide,
	Color,
	ShaderMaterial,
	UniformsLib,
	UniformsUtils,
	Vector2,
	Vector4
} from 'three';

/**
 * An outline effect for toon shaders.
 *
 * Note that this class can only be used with {@link WebGLRenderer}.
 * When using {@link WebGPURenderer}, use {@link ToonOutlinePassNode}.
 *
 * ```js
 * const effect = new OutlineEffect( renderer );
 *
 * function render() {
 *
 * 	effect.render( scene, camera );
 *
 * }
 * ```
 *
 * @three_import import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';
 */
class InkEffect {

	/**
	 * Constructs a new outline effect.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {OutlineEffect~Options} [parameters] - The configuration parameter.
	 */
	constructor( renderer, parameters = {} ) {

		this.enabled = true;

		const defaultThickness = parameters.defaultThickness !== undefined ? parameters.defaultThickness : 0.003;
		const defaultColor = new Color().fromArray( parameters.defaultColor !== undefined ? parameters.defaultColor : [ 0, 0, 0 ] );
		const defaultAlpha = parameters.defaultAlpha !== undefined ? parameters.defaultAlpha : 1.0;
		const defaultKeepAlive = parameters.defaultKeepAlive !== undefined ? parameters.defaultKeepAlive : false;

		// object.material.uuid -> outlineMaterial or
		// object.material[ n ].uuid -> outlineMaterial
		// save at the outline material creation and release
		// if it's unused removeThresholdCount frames
		// unless keepAlive is true.
		const cache = {};

		const removeThresholdCount = 60;

		// outlineMaterial.uuid -> object.material or
		// outlineMaterial.uuid -> object.material[ n ]
		// save before render and release after render.
		const originalMaterials = {};

		// object.uuid -> originalOnBeforeRender
		// save before render and release after render.
		const originalOnBeforeRenders = {};

		//this.cache = cache;  // for debug

		// shared per-render state: render size in pixels, and the far thinning (ref 0 turns it off)
		const ink = this.ink = parameters.ink || { res: [ 1080, 1920 ], ref: 0, pow: 0.3, min: 0.55, max: 1.6 };

		const uniformsOutline = {
			inkRes: { value: new Vector2( 1080, 1920 ) },
			inkFar: { value: new Vector4( 0, 0.3, 0.55, 1.6 ) },
			outlineThickness: { value: defaultThickness },
			outlineColor: { value: defaultColor },
			outlineAlpha: { value: defaultAlpha }
		};

		const vertexShader = [
			'#include <common>',
			'#include <uv_pars_vertex>',
			'#include <displacementmap_pars_vertex>',
			'#include <fog_pars_vertex>',
			'#include <morphtarget_pars_vertex>',
			'#include <skinning_pars_vertex>',
			'#include <logdepthbuf_pars_vertex>',
			'#include <clipping_planes_pars_vertex>',

			'uniform float outlineThickness;',

			'uniform vec2 inkRes;',
			'uniform vec4 inkFar;', // ref depth (m), power, min, max
			'vec4 calculateOutline( vec4 pos, vec3 normal, vec4 skinned ) {',
			// a small step along the normal, in the object's own units: only its direction on screen is used
			'	vec4 pos2 = projectionMatrix * modelViewMatrix * vec4( skinned.xyz + normal * 0.01, 1.0 );',
			'	if ( pos.w <= 1e-4 || pos2.w <= 1e-4 ) return pos;',
			// NOTE: subtract pos2 from pos because BackSide objectNormal is negative
			'	vec2 d = ( pos.xy / pos.w - pos2.xy / pos2.w ) * inkRes;',
			'	float l = length( d );',
			'	if ( l < 1e-6 ) return pos;',
			'	float px = outlineThickness * inkRes.x / 1080.0;',
			'	if ( inkFar.x > 0.0 ) px *= clamp( pow( inkFar.x / pos.w, inkFar.y ), inkFar.z, inkFar.w );',
			// px pixels on screen = 2 px / res in NDC, times w in clip space
			'	pos.xy += ( d / l ) * ( 2.0 * px / inkRes ) * pos.w;',
			'	return pos;',
			'}',

			'void main() {',

			'	#include <uv_vertex>',

			'	#include <beginnormal_vertex>',
			'	#include <morphnormal_vertex>',
			'	#include <skinbase_vertex>',
			'	#include <skinnormal_vertex>',

			'	#include <begin_vertex>',
			'	#include <morphtarget_vertex>',
			'	#include <skinning_vertex>',
			'	#include <displacementmap_vertex>',
			'	#include <project_vertex>',

			'	vec3 outlineNormal = - objectNormal;', // the outline material is always rendered with BackSide

			'	gl_Position = calculateOutline( gl_Position, outlineNormal, vec4( transformed, 1.0 ) );',

			'	#include <logdepthbuf_vertex>',
			'	#include <clipping_planes_vertex>',
			'	#include <fog_vertex>',

			'}',

		].join( '\n' );

		const fragmentShader = [

			'#include <common>',
			'#include <fog_pars_fragment>',
			'#include <logdepthbuf_pars_fragment>',
			'#include <clipping_planes_pars_fragment>',

			'uniform vec3 outlineColor;',
			'uniform float outlineAlpha;',

			'void main() {',

			'	#include <clipping_planes_fragment>',
			'	#include <logdepthbuf_fragment>',

			'	gl_FragColor = vec4( outlineColor, outlineAlpha );',

			'	#include <tonemapping_fragment>',
			'	#include <colorspace_fragment>',
			'	#include <fog_fragment>',
			'	#include <premultiplied_alpha_fragment>',

			'}'

		].join( '\n' );

		function createMaterial() {

			return new ShaderMaterial( {
				type: 'InkEffect',
				uniforms: UniformsUtils.merge( [
					UniformsLib[ 'fog' ],
					UniformsLib[ 'displacementmap' ],
					uniformsOutline
				] ),
				vertexShader: vertexShader,
				fragmentShader: fragmentShader,
				side: BackSide
			} );

		}

		function getOutlineMaterialFromCache( originalMaterial ) {

			let data = cache[ originalMaterial.uuid ];

			if ( data === undefined ) {

				data = {
					material: createMaterial(),
					used: true,
					keepAlive: defaultKeepAlive,
					count: 0
				};

				cache[ originalMaterial.uuid ] = data;

			}

			data.used = true;

			return data.material;

		}

		function getOutlineMaterial( originalMaterial ) {

			const outlineMaterial = getOutlineMaterialFromCache( originalMaterial );

			originalMaterials[ outlineMaterial.uuid ] = originalMaterial;

			updateOutlineMaterial( outlineMaterial, originalMaterial );

			return outlineMaterial;

		}

		function isCompatible( object ) {

			const geometry = object.geometry;
			const hasNormals = ( geometry !== undefined ) && ( geometry.attributes.normal !== undefined );

			return ( object.isMesh === true && object.material !== undefined && hasNormals === true );

		}

		function setOutlineMaterial( object ) {

			if ( isCompatible( object ) === false ) return;

			if ( Array.isArray( object.material ) ) {

				for ( let i = 0, il = object.material.length; i < il; i ++ ) {

					object.material[ i ] = getOutlineMaterial( object.material[ i ] );

				}

			} else {

				object.material = getOutlineMaterial( object.material );

			}

			originalOnBeforeRenders[ object.uuid ] = object.onBeforeRender;
			object.onBeforeRender = onBeforeRender;

		}

		function restoreOriginalMaterial( object ) {

			if ( isCompatible( object ) === false ) return;

			if ( Array.isArray( object.material ) ) {

				for ( let i = 0, il = object.material.length; i < il; i ++ ) {

					object.material[ i ] = originalMaterials[ object.material[ i ].uuid ];

				}

			} else {

				object.material = originalMaterials[ object.material.uuid ];

			}

			object.onBeforeRender = originalOnBeforeRenders[ object.uuid ];

		}

		function onBeforeRender( renderer, scene, camera, geometry, material ) {

			const originalMaterial = originalMaterials[ material.uuid ];

			// just in case
			if ( originalMaterial === undefined ) return;

			updateUniforms( material, originalMaterial );

		}

		function updateUniforms( material, originalMaterial ) {

			const outlineParameters = originalMaterial.userData.outlineParameters;

			material.uniforms.outlineAlpha.value = originalMaterial.opacity;
			material.uniforms.inkRes.value.set( ink.res[ 0 ], ink.res[ 1 ] );
			material.uniforms.inkFar.value.set( ink.ref || 0, ink.pow ?? 0.3, ink.min ?? 0.55, ink.max ?? 1.6 );

			if ( outlineParameters !== undefined ) {

				if ( outlineParameters.thickness !== undefined ) material.uniforms.outlineThickness.value = outlineParameters.thickness;
				if ( outlineParameters.color !== undefined ) material.uniforms.outlineColor.value.fromArray( outlineParameters.color );
				if ( outlineParameters.alpha !== undefined ) material.uniforms.outlineAlpha.value = outlineParameters.alpha;

			}

			if ( originalMaterial.displacementMap ) {

				material.uniforms.displacementMap.value = originalMaterial.displacementMap;
				material.uniforms.displacementScale.value = originalMaterial.displacementScale;
				material.uniforms.displacementBias.value = originalMaterial.displacementBias;

			}

		}

		function updateOutlineMaterial( material, originalMaterial ) {

			if ( material.name === 'invisible' ) return;

			const outlineParameters = originalMaterial.userData.outlineParameters;

			material.fog = originalMaterial.fog;
			material.toneMapped = originalMaterial.toneMapped;
			material.premultipliedAlpha = originalMaterial.premultipliedAlpha;
			material.displacementMap = originalMaterial.displacementMap;

			if ( outlineParameters !== undefined ) {

				if ( originalMaterial.visible === false ) {

					material.visible = false;

				} else {

					material.visible = ( outlineParameters.visible !== undefined ) ? outlineParameters.visible : true;

				}

				material.transparent = ( outlineParameters.alpha !== undefined && outlineParameters.alpha < 1.0 ) ? true : originalMaterial.transparent;

				if ( outlineParameters.keepAlive !== undefined ) cache[ originalMaterial.uuid ].keepAlive = outlineParameters.keepAlive;

			} else {

				material.transparent = originalMaterial.transparent;
				material.visible = originalMaterial.visible;

			}

			if ( originalMaterial.wireframe === true || originalMaterial.depthTest === false ) material.visible = false;

			if ( originalMaterial.clippingPlanes ) {

				material.clipping = true;

				material.clippingPlanes = originalMaterial.clippingPlanes;
				material.clipIntersection = originalMaterial.clipIntersection;
				material.clipShadows = originalMaterial.clipShadows;

			}

			material.version = originalMaterial.version; // update outline material if necessary

		}

		function cleanupCache() {

			let keys;

			// clear originalMaterials
			keys = Object.keys( originalMaterials );

			for ( let i = 0, il = keys.length; i < il; i ++ ) {

				originalMaterials[ keys[ i ] ] = undefined;

			}

			// clear originalOnBeforeRenders
			keys = Object.keys( originalOnBeforeRenders );

			for ( let i = 0, il = keys.length; i < il; i ++ ) {

				originalOnBeforeRenders[ keys[ i ] ] = undefined;

			}

			// remove unused outlineMaterial from cache
			keys = Object.keys( cache );

			for ( let i = 0, il = keys.length; i < il; i ++ ) {

				const key = keys[ i ];

				if ( cache[ key ].used === false ) {

					cache[ key ].count ++;

					if ( cache[ key ].keepAlive === false && cache[ key ].count > removeThresholdCount ) {

						delete cache[ key ];

					}

				} else {

					cache[ key ].used = false;
					cache[ key ].count = 0;

				}

			}

		}

		/**
		 * When using this effect, this method should be called instead of the
		 * default {@link WebGLRenderer#render}.
		 *
		 * @param {Object3D} scene - The scene to render.
		 * @param {Camera} camera - The camera.
		 */
		this.render = function ( scene, camera ) {

			if ( this.enabled === false ) {

				renderer.render( scene, camera );
				return;

			}

			const currentAutoClear = renderer.autoClear;
			renderer.autoClear = this.autoClear;

			renderer.render( scene, camera );

			renderer.autoClear = currentAutoClear;

			this.renderOutline( scene, camera );

		};

		/**
		 * This method can be used to render outlines in VR.
		 *
		 * ```js
		 * const effect = new OutlineEffect( renderer );
		 * let renderingOutline = false;
		 *
		 * scene.onAfterRender = function () {
		 *
		 * 	if ( renderingOutline ) return;
		 *
		 * 	renderingOutline = true;
		 * 	effect.renderOutline( scene, camera );
		 * 	renderingOutline = false;
		 * };
		 *
		 * function render() {
		 * 	renderer.render( scene, camera );
		 * }
		 * ```
		 *
		 * @param {Object3D} scene - The scene to render.
		 * @param {Camera} camera - The camera.
		 */
		this.renderOutline = function ( scene, camera ) {

			const currentAutoClear = renderer.autoClear;
			const currentSceneAutoUpdate = scene.matrixWorldAutoUpdate;
			const currentSceneBackground = scene.background;
			const currentShadowMapEnabled = renderer.shadowMap.enabled;

			scene.matrixWorldAutoUpdate = false;
			scene.background = null;
			renderer.autoClear = false;
			renderer.shadowMap.enabled = false;

			scene.traverse( setOutlineMaterial );

			renderer.render( scene, camera );

			scene.traverse( restoreOriginalMaterial );

			cleanupCache();

			scene.matrixWorldAutoUpdate = currentSceneAutoUpdate;
			scene.background = currentSceneBackground;
			renderer.autoClear = currentAutoClear;
			renderer.shadowMap.enabled = currentShadowMapEnabled;

		};

		/**
		 * Resizes the effect.
		 *
		 * @param {number} width - The width of the effect in logical pixels.
		 * @param {number} height - The height of the effect in logical pixels.
		 */
		this.setSize = function ( width, height ) {

			renderer.setSize( width, height );

		};

	}

}

/**
 * This type represents configuration settings of `OutlineEffect`.
 *
 * @typedef {Object} OutlineEffect~Options
 * @property {number} [defaultThickness=0.003] - The outline thickness.
 * @property {Array<number>} [defaultColor=[0,0,0]] - The outline color.
 * @property {number} [defaultAlpha=1] - The outline alpha value.
 * @property {boolean} [defaultKeepAlive=false] - Whether to keep alive cached internal materials or not.
 **/


export { InkEffect };
