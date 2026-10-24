import json
import os
OUT=os.path.dirname(os.path.abspath(__file__))+"/"
TOP=0.62   # assumed table-top height (m); check against the 3D table once it lands
class SB:
    def __init__(s,id,title,dur,cast,props=None,gain=0.3,cover=None):
        s.d={"id":id,"title":title,"status":"3D version of the puppet preview in comedy-series/storyboards/; written before the 3D props/moves landed",
             "fps":30,"duration":dur,"cover":cover or round(dur*0.6,1),"set":{"type":"kitchen","time":2.75},
             "music":{"bpm":96,"offset":0,"gain":gain,"parts":[{"at":0,"part":"main"}]},
             "cast":cast,"props":props or [],"shots":[],"actions":[],"fx":[],"sfx":[],"captions":[]}
    def a(s,who,at,do,dur=None,**k):
        x={"who":who,"at":at,"do":do}
        if dur is not None: x["dur"]=dur
        x.update(k); s.d["actions"].append(x)
    def e(s,who,at,expr,dur=0.15): s.a(who,at,"expr",dur,expr=expr)
    def p(s,id,at,dur=0.3,ease="inOut",**st): s.d["actions"].append({"do":"prop","id":id,"at":at,"dur":dur,"ease":ease,"set":st})
    def sfx(s,sound,at,gain=0.6,**k): s.d["sfx"].append({"sound":sound,"at":at,"gain":gain,**k})
    def fx(s,do,at,**k): s.d["fx"].append({"do":do,"at":at,**k})
    def cap(s,f,t,text,pos="top",style=None):
        c={"from":f,"to":t,"text":text,"pos":pos}
        if style: c["style"]=style
        s.d["captions"].append(c)
    def shot(s,at,pos,look,fov=34,**k): s.d["shots"].append({"at":at,"pos":pos,"look":look,"fov":fov,**k})
    def save(s): json.dump(s.d,open(OUT+s.d["id"]+".json","w"),indent=1)
def thud(s,t,big=False,who="phx"):
    s.sfx("impact",t,0.7 if big else 0.5); s.fx("shake",t,dur=0.25 if big else 0.2,amp=0.06 if big else 0.04)
    s.e(who,t+0.02,"dizzy")
WIDE=dict(pos=[0,1.3,6.6],look=[0,1.0,0])
PHX=lambda x,face="3q-right",expr="eager":{"id":"phx","character":"potatobrawl/phoenix","at":[x,0],"face":face,"expr":expr,"seed":2.2}
REA=lambda x,face="3q-left",expr="deadpan":{"id":"rea","character":"potatobrawl/reaper","at":[x,0],"face":face,"expr":expr,"arms":{"R":"hold","L":"rest"},"seed":5.7}

# ---------- Wings only work when nobody's looking (18 s) ----------
s=SB("comedy-06-wings-3d","Wings only work when nobody's looking (3D)",18.0,[PHX(-0.75),REA(0.8,face="back")],gain=0.35,cover=13.6)
s.d["music"]["parts"]=[{"at":0,"part":"main"},{"at":15.0,"part":"stop"}]
s.shot(0,[0,1.6,7.2],[0,1.25,0],36)
s.shot(7.5,[0,1.6,7.2],[0,1.25,0],36,to={"pos":[0,2.3,7.9],"look":[0,1.9,0]},dur=1.2,ease="inOut")
s.shot(9.4,**WIDE)
s.shot(11.3,**WIDE,to={"pos":[0,1.7,7.3],"look":[0,1.4,0]},dur=0.8,ease="inOut")
s.shot(15.6,**WIDE)
s.cap(0.1,4.3,"my wings only work\nwhen nobody's\nlooking")
s.e("phx",0,"delighted"); s.a("phx",0.05,"fly",1.5,to={"x":-0.4,"y":1.1}); s.sfx("whoosh",0.1,0.3,dur=0.5)
s.a("rea",1.6,"turn",0.25,to="3q-left"); s.a("phx",1.62,"drop",0.3); thud(s,1.92)
s.a("rea",2.6,"turn",0.25,to="back"); s.a("phx",2.65,"fly",0.8,to={"x":-0.3,"y":1.0}); s.e("phx",2.65,"delighted"); s.sfx("whoosh",2.65,0.3,dur=0.5)
s.a("rea",3.5,"turn",0.2,to="3q-left"); s.a("phx",3.52,"drop",0.28); thud(s,3.8)
s.a("phx",4.4,"talk",0.8,tone="excited"); s.e("phx",4.4,"cocky"); s.cap(4.4,5.5,"Watch THIS.")
s.a("phx",5.3,"tada",0.6); s.a("phx",5.95,"fly",0.25,to={"x":-0.3,"y":0.3}); s.a("phx",6.2,"drop",0.15); thud(s,6.35,big=True)
# the sneeze
s.e("rea",7.4,"serene"); s.a("rea",7.4,"shake",1.2,amp=0.6); s.a("rea",8.6,"lean",0.15,to=22); s.a("rea",8.9,"lean",0.3,to=0)
s.cap(7.4,8.6,"ah... ah...",pos="top"); s.cap(8.6,9.3,"AH-CHOO",pos="mid")
s.a("phx",7.5,"fly",1.45,to={"x":-0.2,"y":2.6}); s.e("phx",7.5,"delighted"); s.sfx("whoosh",7.5,0.35,dur=0.8)
s.e("rea",9.0,"deadpan"); s.e("phx",8.95,"shocked"); s.sfx("sting",8.95,0.5)
s.a("phx",9.05,"drop",0.45); thud(s,9.5,big=True); s.fx("poof",9.5,who="phx",dur=0.9)
# eyes shut, he flies for real
s.a("rea",10.2,"talk",0.8,tone="calm"); s.cap(10.2,11.6,"I'm not looking.")
s.e("rea",11.0,"serene",0.3); s.a("rea",11.6,"bounce",3.4,amp=0.3)
s.e("phx",10.9,"delighted"); s.a("phx",11.4,"fly",1.5,to={"x":0.1,"y":1.4}); s.sfx("whoosh",11.4,0.3,dur=0.6)
s.a("phx",12.9,"spin",0.9,turns=1); s.a("phx",13.0,"fly",1.6,to={"x":-0.5,"y":1.7}); s.a("phx",14.6,"hover",0.45)
s.fx("sparkle",12.7,who="phx",dur=1.2,count=8); s.fx("notes",12.0,who="rea",dur=1.6,count=4)
# the click: he looks straight into the camera, then drops
s.fx("flash",15.0,dur=0.2,peak=0.6); s.sfx("tink",15.0,0.6); s.cap(15.0,15.9,"*click*")
s.a("phx",15.0,"turn",0.15,to="camera"); s.e("phx",15.0,"shocked"); s.sfx("sting",15.05,0.5)
s.a("phx",15.3,"drop",0.4); thud(s,15.7,big=True)
s.a("rea",16.3,"talk",1.0,tone="question"); s.cap(16.2,18.0,"...what did I miss?")
s.save()

# ---------- Killing time (12 s) ----------
props=[{"id":"clock","kind":"clock","x":0.9,"y":1.95,"z":-2.25},{"id":"table","kind":"table","x":0,"y":0,"z":0},
       {"id":"chairL","kind":"chair","x":-0.78,"y":0,"z":0,"rot":90},{"id":"chairR","kind":"chair","x":0.78,"y":0,"z":0,"rot":-90},
       {"id":"cup","kind":"teacup","x":0.28,"y":TOP,"z":0}]
s=SB("comedy-01-killing-time-3d","Killing time (3D)",12.0,[PHX(-0.78,"right","dizzy"),REA(0.78,"left")],props,cover=5.8)
s.shot(0,[0,1.45,7.4],[0,1.2,0],36)
s.shot(4.0,[0,1.45,7.4],[0,1.2,0],36,to={"pos":[0.3,1.7,6.4],"look":[0.6,1.6,-1.0]},dur=1.0,ease="inOut")
s.shot(5.9,[0,1.45,7.4],[0,1.2,0],36)
s.shot(10.3,[0,1.45,7.4],[0,1.2,0],36,to={"pos":[0.6,1.1,3.6],"look":[0.75,0.95,0]},dur=1.4,ease="inOut")
s.a("phx",0,"sit",seat="chairL",hands="table"); s.a("rea",0,"sit",seat="chairR",hands="table")
for i in range(6): s.sfx("tink",0.1+i*0.9,0.2)
s.cap(0.2,2.0,"waiting for the pizza")
s.a("phx",2.0,"talk",1.5,tone="excited"); s.a("phx",2.0,"shake",1.5,amp=1.2); s.e("phx",2.0,"stern")
s.cap(2.0,4.0,"Ugh. Let's kill\nsome time.")
s.e("phx",3.6,"dizzy",0.3)
s.a("rea",4.0,"look",0.4,to=[0,0.8]); s.a("rea",4.0,"turn",0.6,to="3q-left")
s.a("rea",5.0,"stand",0.3); s.a("rea",5.15,"swing",0.45); s.sfx("whoosh",5.15,0.4,dur=0.4)
s.p("clock",5.55,0.35,"out",split=1); s.sfx("tink",5.6,0.7); s.fx("shake",5.55,dur=0.2,amp=0.04)
s.a("rea",6.2,"sit",seat="chairR",hands="hold"); s.a("rea",6.3,"grab",prop="cup",hand="R"); s.a("rea",6.3,"look",0.3,to=[0,0])
s.e("phx",6.4,"shocked",1.2)
s.sfx("tink",9.9,0.5); s.sfx("tink",10.25,0.4); s.cap(9.9,11.2,"*ding dong*")
s.e("phx",10.0,"dizzy")
s.a("rea",10.4,"turn",0.8,to="camera"); s.e("rea",10.9,"smug",0.4); s.fx("notes",10.9,who="rea",dur=1.0,count=3)
s.save()

# ---------- The jar (23 s) ----------
props=[{"id":"chair","kind":"chair","x":1.35,"y":0,"z":0,"rot":-90},{"id":"jar","kind":"jar","x":-0.25,"y":0.5,"z":0.2,"scale":0.8}]
s=SB("comedy-03-the-jar-3d","The jar (3D)",23.0,[PHX(-0.55,"3q-right","stern"),REA(1.35,"left")],props,cover=10.5)
s.shot(0,[-0.4,1.1,3.6],[-0.4,0.9,0],34)
s.shot(5.8,[0.1,1.3,6.4],[0.1,1.0,0],34)
s.shot(13.5,[0.1,1.3,6.4],[0.1,1.0,0],34,to={"pos":[0.85,1.2,4.6],"look":[0.85,0.9,0]},dur=1.0,ease="inOut")
s.shot(19.6,[0.85,1.2,4.6],[0.85,0.9,0],34,to={"pos":[0.85,1.2,4.3],"look":[0.85,1.05,0]},dur=2.8,ease="in")
s.a("rea",0,"sit",seat="chair",hands="lap"); s.e("rea",0,"serene")
s.a("phx",0,"grab",prop="jar",hand="both"); s.a("phx",0,"holdout",4.3); s.a("phx",0,"shake",1.8,amp=1.2)
s.a("phx",2.0,"hop",0.5,count=1,height=0.25); s.sfx("land",2.5,0.6)
s.a("phx",3.1,"spin",0.7,turns=1); s.sfx("whoosh",3.1,0.3,dur=0.5)
s.a("phx",4.3,"release",prop="jar",to=[-0.1,0,0.3],dur=0.3)
s.a("phx",4.6,"kneel",1.2); s.a("phx",4.7,"shake",1.0,amp=1.5)
s.a("phx",6.0,"move",0.8,to=[-0.95,0]); s.a("phx",6.8,"turn",0.2,to="3q-right")
s.a("phx",6.9,"flare",1.3); s.e("phx",6.9,"cocky"); s.sfx("charge",6.9,0.5)
s.fx("speedlines",7.6,dur=0.6,center=[440,1000],alpha=0.6)
s.fx("flash",8.2,dur=0.2,peak=0.6); s.sfx("impact",8.2,0.7); s.fx("shake",8.2,dur=0.35,amp=0.07)
s.p("jar",8.25,0.3,glow=1); s.fx("poof",8.3,pos=[-0.1,0.2,0.3],dur=1.0)
s.e("phx",8.5,"delighted"); s.e("phx",9.5,"shocked",0.8)
s.cap(9.8,11.6,"welded shut",pos="mid",style="sub")
s.a("phx",11.4,"move",0.6,to=[-0.35,0]); s.a("phx",12.0,"grab",prop="jar",hand="both"); s.p("jar",12.0,3.0,glow=0)
s.a("phx",12.2,"move",1.2,to=[0.45,0]); s.e("phx",12.2,"sad")
s.a("phx",13.5,"offer",4.0); s.sfx("sadslide",13.6,0.5)
s.e("rea",15.0,"deadpan",0.3)
s.a("phx",15.8,"release",prop="jar",to=[0.9,0.55,0.25],dur=0.2); s.a("rea",15.9,"grab",prop="jar",hand="L")
s.a("rea",15.6,"holdout",1.8)
s.a("rea",16.6,"lean",0.2,to=12); s.a("rea",16.8,"lean",0.2,to=0); s.sfx("tink",16.8,0.6)
s.p("jar",16.85,0.3,"out",lid=1); s.sfx("pop",16.9,0.7)
s.a("rea",17.6,"release",prop="jar",to=[0.65,0.55,0.25],dur=0.2); s.a("phx",17.7,"grab",prop="jar",hand="L"); s.a("phx",17.9,"turn",0.3,to="camera")
s.a("phx",18.0,"show",4.5,hand="L"); s.e("phx",18.0,"cocky"); s.fx("sparkle",18.1,who="phx",dur=1.0,count=6)
s.cap(18.3,22.6,"I loosened it\nfor you.")
s.a("rea",19.8,"turn",0.9,to="camera")
s.save()

# ---------- Split it (14 s) ----------
props=[{"id":"table","kind":"table","x":0,"y":0,"z":0},{"id":"chairL","kind":"chair","x":-0.78,"y":0,"z":0,"rot":90},
       {"id":"chairR","kind":"chair","x":0.78,"y":0,"z":0,"rot":-90},{"id":"plate","kind":"plate","x":0,"y":TOP,"z":0},
       {"id":"cookie","kind":"cookie","x":0,"y":TOP+0.02,"z":0},{"id":"cup","kind":"teacup","x":0.32,"y":TOP,"z":0}]
s=SB("comedy-05-split-it-3d","Split it (3D)",14.0,[PHX(-0.78,"right"),REA(0.78,"left")],props,cover=6.6)
s.shot(0,[0,1.5,5.8],[0,0.8,0],34)
s.shot(5.3,[0,1.45,7.2],[0,1.05,0],36)
s.shot(10.6,[0,1.45,7.2],[0,1.05,0],36,to={"pos":[0.65,1.1,3.4],"look":[0.78,0.95,0]},dur=3.0,ease="in")
s.a("phx",0,"sit",seat="chairL",hands="table"); s.a("rea",0,"sit",seat="chairR",hands="table")
s.cap(0.2,2.0,"the last cookie")
s.a("phx",2.0,"talk",1.3,tone="excited"); s.e("phx",2.0,"delighted"); s.cap(2.0,3.6,"Let's split it!")
s.a("rea",3.8,"stand",0.3); s.a("rea",4.0,"swing",0.45); s.sfx("whoosh",4.0,0.4,dur=0.4); s.sfx("tink",4.5,0.6)
s.a("rea",4.8,"sit",seat="chairR",hands="lap")
s.p("cookie",5.5,0.25,"out",split=1); s.sfx("pop",5.5,0.6)
s.p("plate",5.9,0.25,"out",split=1); s.sfx("pop",5.9,0.6)
s.p("table",6.3,0.3,"out",split=1); s.sfx("impact",6.3,0.6); s.fx("shake",6.3,dur=0.25,amp=0.05)
s.p("cup",6.8,0.3,"out",split=1,fill=0,spill=1); s.sfx("poof",6.8,0.5)
s.e("phx",5.5,"shocked"); s.e("rea",6.9,"dizzy")
s.p("cookie",7.6,0.9,x=-0.45,y=TOP-0.05)
s.a("phx",8.6,"grab",prop="cookie",hand="R")
s.e("phx",8.8,"cocky")
s.p("cookie",10.0,0.2,"out",scale=0); s.sfx("pop",10.0,0.5); s.sfx("pop",10.3,0.4)
s.e("rea",9.5,"deadpan",0.4)
s.cap(10.5,13.8,"Thanks for\nsplitting it.")
s.a("rea",11.2,"turn",0.9,to="camera")
s.save()
