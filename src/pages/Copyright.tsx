export default function Copyright() {
  return (
    <div className="bg-background min-h-screen pt-24 pb-20 px-4 md:px-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-display text-4xl mb-6">Copyright Notice</h1>
        <div className="space-y-4 text-foreground/80 text-sm leading-relaxed">
          <p>© {new Date().getFullYear()} HADZ Group of Companies. All Rights Reserved.</p>
          <h2 className="text-display text-xl mt-6">Intellectual Property</h2>
          <p>All content available on Cinematic Lens, including but not limited to movies, VJ content, series, thumbnails, logos, and related materials, are the property of HADZ Group of Companies or its licensors and are protected by applicable copyright and intellectual property laws.</p>
          <h2 className="text-display text-xl mt-6">Prohibited Use</h2>
          <p>No part of the content on this platform may be reproduced, distributed, transmitted, displayed, published, or broadcast without prior written permission from HADZ Group of Companies.</p>
          <h2 className="text-display text-xl mt-6">DMCA / Takedown Requests</h2>
          <p>If you believe that content on Cinematic Lens infringes your copyright, please contact us at hadzgroupofcompanies@gmail.com with details of the alleged infringement.</p>
          <h2 className="text-display text-xl mt-6">Trademarks</h2>
          <p>"Cinematic Lens" and the Cinematic Lens logo are trademarks of HADZ Group of Companies. Unauthorized use of these trademarks is prohibited.</p>
        </div>
      </div>
    </div>
  );
}
