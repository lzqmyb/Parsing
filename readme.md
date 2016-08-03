### Example
```
header.wav
begin.wav
question.wav
{'c1.wav': ['红'], 'c2.wav': ['绿']}
c1.wav {'c3.wav': ['大'], 'c4.wav': ['小']} 00.wav
c2.wav {'c5.wav': ['左'], 'c6.wav': ['右']} 01.wav
c7.wav
c8.wav
{'c9.wav': ['上'], 'c10.wav': ['下']}
c9.wav end1.wav
c10.wav end2.wav
$share
```

### 解释
- `header.wav` 直接播放 header.wav。
- `{'c1.wav': ['红'], 'c2.wav': ['绿']}` 直接选择，根据候选关键词选择不同的文件进行播放。
- `c1.wav {'c3.wav': ['大'], 'c4.wav': ['小']} 00.wav` c1.wav 作为一个条件 flag，只有播放 c1.wav 之后才会进入后边的选择，00.wav 作为默认处理。
- `c9.wav end1.wav` `c9.wav` 作为一个条件 flag，只有播放 c9.wav 之后才会播放 end1.wav。
- `$share` 作为分享指令，可以提示用户将文件分享出去。

### 进度记录
- 进度记录都会在每次播放开始和中断的时候记录。
- 记录播放路径 {"interaction_story": ["header.wav", "begin.wav"]}。
- 记录播放节点 {"timestamp": "06.36"}。
