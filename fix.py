import re

with open('frontend/src/pages/Scanner.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: 244-262
content = re.sub(
    r'<<<<<<< HEAD\n\s+const res = await api\.get\(`/api/entries/\$\{entry_id\}`\)\n\s+setEntryDetails\(res\.data\)\n\n\s+try \{\n\s+const movesRes = await api\.get\(`/api/forward/entry/\$\{entry_id\}/movements`\)\n\s+setMovements\(movesRes\.data \|\| \[\]\)\n\s+\} catch \(moveErr\) \{\n\s+console\.error\(\'Failed to fetch movements\', moveErr\)\n\s+setMovements\(\[\]\)\n\s+\}\n\n=======\n\s+const res = await api\.get\(`/api/entries/\$\{entry_id\}/tracking`\)\n\s+setEntryDetails\(res\.data\.entry\)\n\s+setMovements\(res\.data\.movements \|\| \[\]\)\n\s+setEditHistory\(res\.data\.edit_history \|\| \[\]\)\n\s+\n>>>>>>> origin/shradha-feature-branch',
    '''      const res = await api.get(`/api/entries/${entry_id}/tracking`)
      setEntryDetails(res.data.entry)
      setMovements(res.data.movements || [])
      setEditHistory(res.data.edit_history || [])''',
    content
)

# Fix 2: 268-271
content = re.sub(
    r'<<<<<<< HEAD\n\s+setMovements\(\[\]\)\n=======\n>>>>>>> origin/shradha-feature-branch\n',
    '',
    content
)

# Fix 3 and 4:
content = re.sub(
    r'<<<<<<< HEAD\n\s+const movesRes = await api\.get\(`/api/forward/entry/\$\{entryDetails\.id\}/movements`\)\n\s+setMovements\(movesRes\.data \|\| \[\]\)\n\s+\} catch \(e\) \{ \}\n=======\n\s+const movesRes = await api\.get\(`/api/entries/\$\{entryDetails\.id\}/tracking`\)\n\s+setMovements\(movesRes\.data\.movements \|\| \[\]\)\n\s+setEditHistory\(movesRes\.data\.edit_history \|\| \[\]\)\n\s+\} catch\(e\) \{\}\n>>>>>>> origin/shradha-feature-branch',
    '''        const movesRes = await api.get(`/api/entries/${entryDetails.id}/tracking`)
        setMovements(movesRes.data.movements || [])
        setEditHistory(movesRes.data.edit_history || [])
      } catch(e) {}''',
    content
)

# Fix 5: Lines 584-691
# To safely fix this, I will use replace on a slice
start_marker = ') : (\n                  <motion.div\n                    key="details"\n                    initial={{ opacity: 0, x: 20 }}'
end_marker = '                                <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg border ${getPriorityColor(entryDetails.priority)}`}>\n                                  {entryDetails.priority}\n                                </span>\n                              </div>'

replacement_5 = '''                ) : (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    {verificationComplete ? (
                      <>
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center"
                          >
                            <CheckCircle size={20} className="text-emerald-600" />
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-black text-emerald-600 tracking-tight">QR Verified</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                              Entry UID: {scannedData.unique_id?.startsWith('PTRK') ? scannedData.unique_id : `#${scannedData.unique_id?.slice(0, 8) || 'N/A'}`}
                            </p>
                            {editHistory.length > 0 && (
                              <p className="text-[9px] font-bold text-violet-500 mt-0.5">
                                ✏ Last updated by {editHistory[0]?.edited_by_name || 'Unknown'} · {new Date(editHistory[0]?.edited_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                          </div>
                        </div>

                        {fetchingDetails ? (
                          <div className="py-12 text-center">
                            <Loader2 size={28} className="text-slate-400 animate-spin mx-auto mb-4" />
                            <p className="text-slate-400 text-[10px] font-bold">Loading patrak details...</p>
                          </div>
                        ) : entryDetails ? (
                          <div className="space-y-4">
                            {/* Patrak Info Card */}
                            <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl p-5 border border-slate-100">
                              <div className="flex items-start justify-between gap-3 mb-4">
                                <div className="flex-1">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Subject</p>
                                  <h4 className="text-[13px] font-black text-slate-800 leading-snug line-clamp-2">{entryDetails.subject}</h4>
                                </div>
                                <div className="flex flex-col items-end gap-1.5">
                                  <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg border ${getPriorityColor(entryDetails.priority)}`}>
                                    {entryDetails.priority}
                                  </span>
                                  {editHistory.length > 0 && (
                                    <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-md bg-violet-100 text-violet-700 border border-violet-200">
                                      ✏ Updated
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>'''

s_idx = content.find(start_marker)
if s_idx != -1:
    e_idx = content.find(end_marker, s_idx)
    if e_idx != -1:
        e_idx += len(end_marker)
        content = content[:s_idx] + replacement_5 + content[e_idx:]

# Fix 6: 750-793
content = re.sub(
    r'<<<<<<< HEAD\n\s+<div>\n\s+<p className="text-\[11px\] font-black text-slate-800 tracking-tight">Pending Arrival</p>\n\s+<p className="text-\[9px\] font-medium text-slate-500">Review details or confirm immediately</p>\n=======\n\s+<div className="flex items-center gap-3 w-full md:w-auto">\n\s+<Button\n\s+onClick=\{handleEditDetails\}\n\s+variant="outline"\n\s+className="flex-1 md:flex-none !border-teal-200 !text-teal-700 hover:!bg-teal-50 !font-black !text-\[10px\] px-5 shadow-sm transition-all"\n\s+>\n\s+<Edit2 size=\{14\} className="mr-2" />\n\s+Edit Details\n\s+</Button>\n\s+<Button\n\s+onClick=\{handleConfirmArrival\}\n\s+loading=\{receiving\}\n\s+className="flex-1 md:flex-none !bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 !text-white !shadow-lg !shadow-amber-200 !font-black !text-\[10px\] px-6 transition-all"\n\s+>\n\s+<CheckCircle size=\{14\} className="mr-2" />\n\s+Confirm Arrival\n\s+</Button>\n>>>>>>> origin/shradha-feature-branch\n\s+</div>\n\s+</div>\n\s+<div className="flex items-center gap-3 w-full md:w-auto">\n\s+<Button\n\s+onClick=\{openEditModal\}\n\s+variant="outline"\n\s+className="flex-1 md:flex-none !border-teal-200 !text-teal-700 hover:!bg-teal-50 !font-black !text-\[10px\] px-5 shadow-sm transition-all"\n\s+>\n\s+<Edit2 size=\{14\} className="mr-2" />\n\s+Edit Details\n\s+</Button>\n\s+<Button\n\s+onClick=\{handleConfirmArrival\}\n\s+loading=\{receiving\}\n\s+className="flex-1 md:flex-none !bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 !text-white !shadow-lg !shadow-amber-200 !font-black !text-\[10px\] px-6 transition-all"\n\s+>\n\s+<CheckCircle size=\{14\} className="mr-2" />\n\s+Confirm Arrival\n\s+</Button>\n\s+</div>',
    '''                                    <div>
                                      <p className="text-[11px] font-black text-slate-800 tracking-tight">Pending Arrival</p>
                                      <p className="text-[9px] font-medium text-slate-500">Review details or confirm immediately</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 w-full md:w-auto">
                                    <Button
                                      onClick={handleEditDetails}
                                      variant="outline"
                                      className="flex-1 md:flex-none !border-teal-200 !text-teal-700 hover:!bg-teal-50 !font-black !text-[10px] px-5 shadow-sm transition-all"
                                    >
                                      <Edit2 size={14} className="mr-2" />
                                      Edit Details
                                    </Button>
                                    <Button
                                      onClick={handleConfirmArrival}
                                      loading={receiving}
                                      className="flex-1 md:flex-none !bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 !text-white !shadow-lg !shadow-amber-200 !font-black !text-[10px] px-6 transition-all"
                                    >
                                      <CheckCircle size={14} className="mr-2" />
                                      Confirm Arrival
                                    </Button>
                                  </div>''',
    content
)

# Fix 7: Edit Modal deletion
s_idx = content.find('<<<<<<< HEAD\n      {/* Edit Modal */}')
if s_idx != -1:
    e_idx = content.find('>>>>>>> origin/shradha-feature-branch', s_idx)
    if e_idx != -1:
        e_idx += len('>>>>>>> origin/shradha-feature-branch\n')
        content = content[:s_idx] + content[e_idx:]

with open('frontend/src/pages/Scanner.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
