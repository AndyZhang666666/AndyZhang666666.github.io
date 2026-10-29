"""Generate no-model examples or recompute a saved run's grade offline."""
import argparse
import json
import tempfile
from pathlib import Path
from cases import CASES, VERSION
from store import Store, digest
from grading import grade

def examples(path):
    pairs = {}
    with tempfile.TemporaryDirectory() as tmp:
        store = Store(Path(tmp) / 'examples.sqlite3')
        for case in CASES:
            records = store.pair('example-author', {'case_id': case['id'], 'request_id': case['id'], 'mode': 'program'})
            completed = []
            for record in records:
                rid = record['run']['id']
                for _ in range(25):
                    r = record['run']
                    if r['state'] == 'running':
                        record = store.program_step(rid, 'example-author')
                    elif r['state'] == 'awaiting_confirmation':
                        if case['id'] == 'cancel':
                            record = store.action(rid, 'example-author', 'cancel', {})
                        else:
                            record = store.action(rid, 'example-author', 'confirm', {'digest': digest(r['pending'])})
                    elif r['state'] == 'unknown' and case['id'] == 'interrupted':
                        record = store.action(rid, 'example-author', 'recover', {})
                    else:
                        break
                record['source'] = 'example'
                record['provenance'] = {'kind': 'original-program-example', 'model': None,
                    'description': '原创虚构案例；由确定性程序策略实际执行 SQLite 工具后生成，不是模型评测或真实 AI 回放。',
                    'generator': 'python3 backend/cli.py examples', 'versions': VERSION}
                completed.append(record)
            pairs[case['id']] = completed
    path.write_text(json.dumps({'schema': 'agent-bench-examples-v1', 'cases': CASES, 'versions': VERSION,
                               'pairs': pairs}, ensure_ascii=False, indent=2) + '\n')

def main():
    p = argparse.ArgumentParser(description=__doc__)
    sub = p.add_subparsers(dest='command', required=True)
    g = sub.add_parser('examples')
    g.add_argument('--out', default=str(Path(__file__).resolve().parent.parent / 'samples' / 'examples.json'))
    s = sub.add_parser('rescore')
    s.add_argument('record')
    args = p.parse_args()
    if args.command == 'examples':
        examples(Path(args.out))
        print('Wrote original program examples (not model results).')
    else:
        print(json.dumps(grade(json.loads(Path(args.record).read_text())), ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
