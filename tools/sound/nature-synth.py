# Procedural nature beds (after A. Farnell, Designing Sound, 2010: wind, leaves, water): filtered noise only, no
# resonant or tonal parts, so nothing can ring metallic. Seeded, 32 s, 44.1 kHz mono.
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, lfilter
SR=44100; N=32*SR
def bp(x,lo,hi,o=2): return sosfilt(butter(o,[lo,hi],"band",fs=SR,output="sos"),x)
def lp(x,f,o=2): return sosfilt(butter(o,f,"low",fs=SR,output="sos"),x)
def hp(x,f,o=2): return sosfilt(butter(o,f,"high",fs=SR,output="sos"),x)
def pink(r,n):
    w=r.standard_normal(n); b=[0.049922035,-0.095993537,0.050612699,-0.004408786]; a=[1,-2.494956002,2.017265875,-0.522189400]
    return lfilter(b,a,w)
def slow(r,n,hz):   # smooth random control signal 0..1 with changes at about hz
    k=max(2,int(n/SR*hz)+2); pts=r.random(k); t=np.linspace(0,k-1,n)
    i=np.floor(t).astype(int); f=t-i; f=f*f*(3-2*f); i=np.minimum(i,k-2)
    return pts[i]*(1-f)+pts[i+1]*f
def norm(x): x=x-x.mean(); return x/np.abs(x).max()*0.7
def wind(seed):
    r=np.random.default_rng(seed); g=0.35+0.65*slow(r,N,0.25)**1.5            # gusts every few seconds
    g=g*(0.85+0.15*slow(r,N,1.2))
    n=pink(r,N); body=lp(hp(n,90),700)                                        # the broad low rush
    air=bp(r.standard_normal(N),900,3500)*0.25                                 # the airy top, no whistle
    return norm(body*g + air*g**2)
def leaves(seed):
    r=np.random.default_rng(seed); g=0.25+0.75*slow(r,N,0.3)**1.3
    out=np.zeros(N); rate=900*g                                                # grains per second follow the gusts
    t=0
    while t<N-2000:
        t+=int(SR/max(rate[t],30)*r.exponential(1))
        if t>=N-2000: break
        L=int(SR*r.uniform(0.004,0.025)); e=np.exp(-np.linspace(0,6,L))*r.uniform(0.2,1)*g[t]
        out[t:t+L]+=r.standard_normal(L)*e
    out=bp(out,1200,7500)+0.15*lp(hp(pink(r,N),120),900)*g                    # leaves + the breeze moving them
    return norm(out)
def waterfall(seed):
    r=np.random.default_rng(seed); m=0.9+0.1*slow(r,N,0.6)
    roar=lp(hp(pink(r,N),60),2600,4)*m
    spray=bp(r.standard_normal(N),2500,9000)*0.12*(0.8+0.2*slow(r,N,2))
    return norm(roar+spray)
for name,f in [("wind",wind),("leaves",leaves),("waterfall",waterfall)]:
    for s in (1,2): sf.write(f"{name}-s{s}.wav",f(s*7919+len(name)),SR)
print("ok")
