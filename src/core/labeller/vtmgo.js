/**
 * @module
 */
/* eslint-disable require-await */

/**
 * Extrait le titre d'une vidéo VTM GO.
 *
 * @param {string} type    Le type de la vidéo (<code>"episodes"</code> ou
 *                         <code>"movies"</code>).
 * @param {string} videoId L'identifiant de la vidéo VTM GO.
 * @returns {Promise<string|undefined>} Une promesse contenant le titre ou
 *                                      <code>undefined</code>.
 */
const extractVideo = async function (type, videoId) {
    const response = await fetch("https://vtm.be/vtmgo/afspelen" +
                                                `/${type.charAt(0)}${videoId}`);
    const text = await response.text();
    const doc = new DOMParser().parseFromString(text, "text/html");
    return doc.querySelector("h1.player__title")?.textContent;
};

/**
 * Extrait le titre d'un épisode VTM GO.
 *
 * @param {string} episodeId L'identifiant de l'épisode VTM GO.
 * @returns {Promise<string|undefined>} Une promesse contenant le titre ou
 *                                      <code>undefined</code>.
 */
export const extractEpisode = async function (episodeId) {
    return extractVideo("episodes", episodeId);
};

/**
 * Extrait le titre d'un film VTM GO.
 *
 * @param {string} movieId L'identifiant du film VTM GO.
 * @returns {Promise<string|undefined>} Une promesse contenant le titre ou
 *                                      <code>undefined</code>.
 */
export const extractMovie = async function (movieId) {
    return extractVideo("movies", movieId);
};

/**
 * Extrait le titre d'une chaine VTM GO.
 *
 * @param {string} channelId L'identifiant de la chaine VTM GO.
 * @returns {Promise<string|undefined>} Une promesse contenant le titre ou
 *                                      <code>undefined</code>.
 */
export const extractChannel = async function (channelId) {
    const response = await fetch("https://vtm.be/vtmgo/live-kijken/vtm");
    const text = await response.text();
    const doc = new DOMParser().parseFromString(text, "text/html");
    const a = doc.querySelector(`a[data-gtm*="/${channelId}/"]`);
    return null === a ? undefined
                      : a.dataset.gtm.slice(a.dataset.gtm.lastIndexOf("/") + 1);
};
