"""Extract official PDF table cells without deriving points from prices.
Requires pdfplumber. Usage: python extract_prices.py MY|SG source.pdf output.json
Keeps source page/cells; rejects ambiguous rows for human review.
"""
import sys, re, json, hashlib
import pdfplumber
market, path, output = sys.argv[1:]
assert market in ('MY', 'SG')
rows, rejected = [], []
category, brand = 'Other', 'Other'
known = [('nutrilite','Nutrilite','Nutrition & Wellness'),('bodykey','BodyKey','Nutrition & Wellness'),('vital treasures','Vital Treasures','Nutrition & Wellness'),('artistry','Artistry','Beauty'),('satinique','Satinique','Personal Care'),('glister','Glister','Personal Care'),('g&h','G&H','Personal Care'),('allano','Allano','Personal Care'),('aloe care','Aloe Care','Personal Care'),('espring','eSpring','Home Appliances'),('atmosphere','Atmosphere','Home Appliances'),('amway home','Amway Home','Home Care'),('dish drops','Amway Home','Home Care'),('sa8','Amway Home','Home Care'),('l.o.c.','Amway Home','Home Care'),('pursue','Amway Home','Home Care'),('xs™','XS','Sports Nutrition & Energy'),('xs ','XS','Sports Nutrition & Energy'),('icook','iCook','Houseware'),('noxxa','Noxxa','Houseware')]
num = re.compile(r'^\d[\d,]*(?:\.\d+)?$')
def parse_value(s):
 s=s.strip().replace('\u200b','')
 if s in ('-', '–', '—'): return None, None, 'not_applicable'
 ns=re.findall(r'\d[\d,]*(?:\.\d+)?',s)
 if len(ns)==1 and num.fullmatch(s): return float(ns[0].replace(',','')), None, 'assigned'
 if len(ns)==2 and re.fullmatch(r'[\d,.]+\s*[-–]\s*[\d,.]+',s):
  a,b=map(lambda v:float(v.replace(',','')),ns)
  if a<=b: return a,b,'range'
 return None,None,'unknown'
with pdfplumber.open(path) as pdf:
 for page_no,p in enumerate(pdf.pages,1):
  if (market=='MY' and not 2<=page_no<=14) or (market=='SG' and page_no>9): continue
  words=p.extract_words(x_tolerance=1,y_tolerance=2)
  lines=[]
  for w in sorted(words,key=lambda w:(round(w['top']/2),w['x0'])):
   line=next((l for l in reversed(lines[-5:]) if abs(l[0]['top']-w['top'])<2),None)
   if line is None: lines.append([w])
   else: line.append(w)
  lines.sort(key=lambda l:l[0]['top'])
  centers=([282,325,365,410,454] if market=='MY' else [500.5,521,541.6,564.8,588])
  for li,line in enumerate(lines):
   line.sort(key=lambda w:w['x0']); text=' '.join(w['text'] for w in line)
   headers=[w for w in line if w['text'] in ('PV','BV','AP','RP')]
   if len(headers)>=4 and [w['text'] for w in headers[:4]]==['PV','BV','AP','RP']:
    centers=[(w['x0']+w['x1'])/2 for w in headers[:5]]
    if len(centers)==4: centers.append(centers[-1]+24)
   code=next((w for w in line if re.fullmatch(r'\d{5,8}[A-Z]?',w['text']) and w['x0']<80),None)
   if code is None:
    low=text.lower()
    if 'personal care range' in low: category,brand='Personal Care','Other'
    if 'home care range' in low or low.startswith('amway home'): category,brand='Home Care','Amway Home'
    if 'houseware' in low: category,brand='Houseware','Other'
    if 'business support' in low or 'awards and recognition' in low: category,brand='Business Support','Other'
    if 'personal shoppers' in low: category,brand='Lifestyle','Other'
    for key,b,c in known:
     if key in low and len(low)<160: brand,category=b,c; break
    continue
   bounds=[(centers[i]+centers[i+1])/2 for i in range(4)]
   left=centers[0]-(centers[1]-centers[0])/2
   values=[]
   for i in range(4):
    a=left if i==0 else bounds[i-1]; b=bounds[i]
    values.append(' '.join(w['text'] for w in line if a<=(w['x0']+w['x1'])/2<b))
   # A following line may contain the high end of a range.
   for following in lines[li+1:li+2]:
    if following[0]['top']-line[0]['top']<11 and not any(re.fullmatch(r'\d{5,8}[A-Z]?',w['text']) and w['x0']<80 for w in following):
     for i,v in enumerate(values):
      if v.endswith(('-', '–')) and v not in ('-', '–'):
       a=left if i==0 else bounds[i-1]; b=bounds[i]
       values[i]+=' '+ ' '.join(w['text'] for w in following if a<=(w['x0']+w['x1'])/2<b)
   end=225 if market=='SG' else left
   name=' '.join(w['text'] for w in line if w['x0']>=code['x1'] and (w['x0']+w['x1'])/2<end)
   if not name or not all(parse_value(v)[2]!='unknown' for v in values):
    rejected.append({'market':market,'sku':code['text'],'page':page_no,'label':name,'cells':values,'reason':'Incomplete/ambiguous table row; not published'});continue
   # Retain English name continuations, excluding bundle contents / ordering notes.
   for following in lines[li+1:li+3]:
    if following[0]['top']-line[0]['top']>21: break
    parts=[w for w in following if code['x1']+1<=w['x0']<end]
    if not parts or parts[0]['text'].startswith(('•','*','Price','BNPL','EPS')): break
    if any(re.fullmatch(r'\d{5,8}[A-Z]?',w['text']) and w['x0']<80 for w in following): break
    if any(w['text'] in ('PV','BV','AP','RP') for w in following): break
    # Don't append a pack's ingredient list or a section heading.
    if parts[0]['x0']<code['x1']+1: break
    if abs(parts[0]['x0']-next(w['x0'] for w in line if w['x0']>=code['x1']))>3: break
    name+=' '+' '.join(w['text'] for w in parts)
   row={'market':market,'sku':code['text'],'name':name,'category':category,'brand':brand,'source_page':page_no,'pack':(' '.join(w['text'] for w in line if 428<=w['x0']<489) if market=='SG' else ''),'raw_values':dict(zip(['pv','bv','ap','rp'],values))}
   for k,v in zip(['pv','bv','ap','rp'],values):
    lo,hi,state=parse_value(v); row[k]=lo;row[k+'_max']=hi;row[k+'_status']=state
   for key,b,c in known:
    if key in name.lower():row['brand'],row['category']=b,c;break
   rows.append(row)
# Shared shade rows and mattress codes below their values need a second pass.
if market=='MY':
 import subprocess
 pages=subprocess.check_output(['pdftotext','-layout',path,'-']).decode().split('\f')
 token=r'(?:[0-9][0-9,]*\.[0-9]+|-)'
 table=re.compile(r'^(.*?)\s+('+token+r')\s+('+token+r')\s+('+token+r')\s+('+token+r')\s+('+token+r')\s+('+token+r')\s+('+token+r')\s*$')
 for pi in [5,6,11,12]:
  group=None
  for line in pages[pi].splitlines():
   match=table.match(line.strip())
   if match and re.match(r'^\d{5,8}',match[1]):
    group=None; continue
   if match and not re.match(r'^\d{5,8}',match[1]):
    group=(re.sub(r'\s+', ' ', match[1]),list(match.groups()[1:5])); continue
   if group and re.match(r'^\s*\d{5,8}',line):
    pieces=list(re.finditer(r'(?<!\d)(\d{5,8}[A-Z]?)\s+',line))
    for ni,c in enumerate(pieces):
     sku=c[1]; variant=line[c.end():pieces[ni+1].start() if ni+1<len(pieces) else len(line)].strip()
     row={'market':market,'sku':sku,'name':group[0]+' — '+variant,'category':'Beauty' if pi in (5,6) else 'Lifestyle','brand':'Artistry' if pi in (5,6) else 'Dreamland','source_page':pi+1,'raw_values':dict(zip(['pv','bv','ap','rp'],group[1]))}
     for k,v in row['raw_values'].items():
      row[k],row[k+'_max'],row[k+'_status']=parse_value(v)
     rows.append(row)
    if pi in (11,12):group=None
   elif group and line.strip() and not re.search(r'[\u4e00-\u9fff]',line) and not any(x in line for x in ['ABO PRICE','SPF','Foundation','Cream','Matte','West Malaysia','Metallic','Shimmer','Satin','Sheer']):
    # Stop at unrelated section headers; blank lines are harmless.
    if not re.match(r'^\s*\d',line) and 'PV' in line: group=None
if market=='SG':
 existing={r['sku'] for r in rows}
 with pdfplumber.open(path) as pdf:
  for page_no,p in enumerate(pdf.pages[:9],1):
   for table in p.find_tables():
    for cells,values in zip(table.rows,table.extract()):
     if len(values)!=5 or not all(v and parse_value(v.replace('\n',' '))[2]!='unknown' for v in values[1:]):continue
     cell=cells.cells[0]
     if not cell:continue
     ew=[w for w in p.extract_words(x_tolerance=1,y_tolerance=2) if cell[1]<=(w['top']+w['bottom'])/2<cell[3] and cell[0]<=w['x0']<min(225,cell[2])]
     el=[]
     for w in sorted(ew,key=lambda w:(round(w['top']/2),w['x0'])):
      if not el or abs(el[-1][0]['top']-w['top'])>=2:el.append([w])
      else:el[-1].append(w)
     english='\n'.join(' '.join(w['text'] for w in sorted(l,key=lambda w:w['x0'])) for l in el)
     lines=english.splitlines(); group=lines[0] if lines else ''
     if re.match(r'^\d{5,8}',group):continue
     for line in lines[1:]:
      match=re.match(r'^(\d{5,8}[A-Z]?)\s+(.+)$',line)
      if not match or match[1] in existing:continue
      name=group+' — '+match[2]
      b,c=('Artistry','Beauty') if 'artistry' in name.lower() or page_no in (3,4,5) else ('Satinique','Personal Care') if page_no==6 else ('Glister','Personal Care') if page_no==7 else ('Nutrilite','Nutrition & Wellness')
      row={'market':market,'sku':match[1],'name':name,'category':c,'brand':b,'source_page':page_no,'raw_values':dict(zip(['pv','bv','ap','rp'],[v.replace('\n',' ') for v in values[1:]]))}
      for k,v in row['raw_values'].items():row[k],row[k+'_max'],row[k+'_status']=parse_value(v)
      rows.append(row);existing.add(match[1])
unique={}; conflicts=set()
for r in rows:
 key=r['sku']
 if key in unique:
  previous=unique[key]
  if previous['raw_values']!=r['raw_values'] or (market=='MY' and previous['name']!=r['name']):
   conflicts.add(key);rejected.append({'market':market,'sku':key,'page':r['source_page'],'reason':'Conflicting duplicate in source; not published'})
 else:unique[key]=r
rows=[r for k,r in unique.items() if k not in conflicts]
valid={r['sku'] for r in rows}
rejected=[r for r in rejected if r['sku'] not in valid]
json.dump({'market':market,'sha256':hashlib.sha256(open(path,'rb').read()).hexdigest(),'rows':rows,'review_queue':rejected},open(output,'w'),ensure_ascii=False,indent=2)
print(market,len(rows),'published candidates;',len(rejected),'rows require review')
