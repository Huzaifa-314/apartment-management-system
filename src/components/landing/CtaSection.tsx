import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../shared/Button';

const onBlueOutlineClass =
  '!border !border-white !bg-transparent !text-white hover:!bg-white/15 hover:!text-white';

type CtaSectionProps = {
  ctaSubtext: string;
};

const CtaSection: React.FC<CtaSectionProps> = ({ ctaSubtext }) => {
  return (
    <section className="border-t border-blue-500/30 bg-gradient-to-r from-blue-600 to-blue-700 py-12 text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl font-semibold md:text-3xl">Ready to get started?</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-blue-100 md:text-base">{ctaSubtext}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link to="/rooms">
            <Button variant="ghost" size="lg" className={onBlueOutlineClass}>
              Browse rooms
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
