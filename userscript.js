// ==UserScript==
// @name         LLM Canvas Helper
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  adds a 'look up with ai' button to specific sections on *.instructure.com pages
// @author       https://github.com/SoBloxsy
// @match        *://*.instructure.com/*
// @updateURL    https://raw.githubusercontent.com/SoBloxsy/llm-canvas-helper/main/userscript.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';


    function addLookupButtons() {
        document.querySelectorAll('div[data-automation="sdk-take-item-question"]').forEach((parentDiv) => {
            const section = parentDiv.querySelector('section.css-9jay18');
            const contentDiv = parentDiv.querySelector('div.user_content.css-pjvf3d.enhanced');

            if (section && contentDiv && !section.querySelector('.ai-lookup-button')) {
                const button = document.createElement('button');
                button.textContent = 'LLM Help';
                button.className = 'ai-lookup-button';
                button.style.marginLeft = '10px';

                button.addEventListener('click', async () => {
                    const textToSend = contentDiv.textContent.trim();
                    console.log('sending to llmstudio api:', textToSend);

                    try {
                        const response = await fetch('http://localhost:1234/v1/completions', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                model: 'gemma-3-12b-it',
                                prompt: `${textToSend}\n\nplease analyze the text and provide the best answer in the following format: "i think the answer is X [ANSWER: X]" where X is your selected answer.`,
                                max_tokens: 50,
                                n: 1,
                                stop: null,
                                temperature: 0.7,
                            }),
                        });

                        if (!response.ok) {
                            throw new Error(`api call failed with status: ${response.status}`);
                        }

                        const data = await response.json();
                        const aiResponse = data.choices[0].text.trim();
                        console.log('llmstudio api response:', aiResponse);

                        // extract the answer using regex
                        const answerMatch = aiResponse.match(/\[ANSWER:\s*(.*?)\]/i);
                        if (answerMatch && answerMatch[1]) {
                            const answer = answerMatch[1];
                            console.log('extracted answer:', answer);
                        } else {
                            console.warn('no answer found in the ai response.');
                        }
                    } catch (error) {
                        console.error('error during api call:', error);
                    }
                });

                section.appendChild(button);
            }
        });
    }

    addLookupButtons();

    const observer = new MutationObserver(addLookupButtons);
    observer.observe(document.body, { childList: true, subtree: true });
})();
