import React, { useEffect, useState } from "react";
import './css/card-shuffle.css'
/**
 * 
 * @returns Fisher–Yates shuffle --- https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
 */
function shuffle(arr: number[]): number[]{
    for(let i = arr.length - 1; i>0; --i){
        const randomIndex = Math.floor( Math.random() * (i-1) );
        [arr[i], arr[randomIndex]] = [arr[randomIndex], arr[i]];
    }
    return arr;
}
//* 13 cards of 4 types
const SIZE_OF_DECK = 52;
const DRAW_SIZE = 4;
const CARD_TYPES_CLASS_NAME = ['spade', 'diamond', 'club', 'heart'];
const CARD_NUMBER_LABEL = new Map([
    [0, 'A'],
    [10, 'J'],
    [11, 'Q'],
    [12, 'K'],
])
/**
 * using simple math to distinguish between the cards
 * a default cards deck starts from ace of spades and next 12 cards of spades, to next 13 of diamonds, next 13 clubs, hearts.
 * we can number the cards(0 indexed) in this order and retrieve a card based on the index number 0- 51.
 * ex: 
 * index 0 - Ace spades
 * index 1 - 2 spades
 * ...
 * index 13 - Ace of diamonds
 * ...
 * index 51 - King of hearts
 */
function getDistinctCardById(cardIndex: number){
    const cardType = Math.floor((cardIndex) / 13);
    const card = (cardIndex) % 13;

    console.log({cardIndex, cardType, card});
    return {cardIndex, cardType, card};
}
/** Card shuffle main component */
export function CardShuffle () {
    const [deck, setDeck] = useState([] as Array<number>);
    const [cardsDrawn, setCardsDrawn] = useState([] as Array<number>);

    useEffect(
        ()=>{ 
            setDeck(shuffleDeck()) ;
    }, [])
    function shuffleDeck(){
        return shuffle( 
            Array.from( {length: SIZE_OF_DECK}, (_, i)=>i)
        );
    }
    function reShuffle () {
        setDeck(shuffleDeck())
        setCardsDrawn([]);
    }
    function drawCards(){
        const cardsDrew: Array<number> = [];
        for(let i = DRAW_SIZE; i>0; --i){
            cardsDrew.push(deck.pop() as number)
        }
        setDeck([...deck]);
        setCardsDrawn(cardsDrawn.concat(cardsDrew));
    }

    return (<div className='cards-game'>
            <h4>Click on the deck to draw {DRAW_SIZE} cards.</h4>
            <section className="flex last-to-end">
                <div className="cards-deck"
                aria-label="Deck of cards">{deck.map( 
                    (num, i)=>{
                        return <InvertedCard action={drawCards} active={i===deck.length-1}></InvertedCard>
                    })}
                </div>
                <button className="clear icon-before refresh" onClick={reShuffle}>Shuffle</button>
            </section>
            <section className="card cards-draw-plane">{cardsDrawn.map( 
                    (num, i)=>{
                        return <Card identifier={num}></Card>
                    })}</section>
        </div>);
}
function InvertedCard ({
    active,
    action
}: {
    active: boolean,
    action: () => void
}){
    return active ? (<button className='clear playing-card inverted' onClick={action}></button>) 
    : (<div className='playing-card inverted'></div>)
}

export function Card ({
    identifier
}: {
    identifier: number  
}) {
    const cardsData = getDistinctCardById(identifier);
    console.log(cardsData)
    return (<div className={`playing-card icon-before icon-after ${CARD_TYPES_CLASS_NAME[cardsData.cardType]}`}>
            <span>{CARD_NUMBER_LABEL.get(cardsData.card) ?? cardsData.card + 1}</span>
            </div>)
}