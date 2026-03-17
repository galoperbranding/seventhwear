export default function Marquee() {
  const text = 'STREETRIDEWEAR <span>✦</span> SEVENTHWEAR <span>✦</span> BORN FROM THE STREETS <span>✦</span> FUELED BY ADRENALINE <span>✦</span> STREETRIDEWEAR <span>✦</span> SEVENTHWEAR <span>✦</span> BORN FROM THE STREETS <span>✦</span> FUELED BY ADRENALINE';

  return (
    <div className="marquee">
      <div className="marquee-track">
        <span className="marquee-item" dangerouslySetInnerHTML={{ __html: text }} />
        <span className="marquee-item" dangerouslySetInnerHTML={{ __html: text }} />
      </div>
    </div>
  );
}
